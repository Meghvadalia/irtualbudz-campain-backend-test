import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { Model } from 'mongoose';
import { KAFKA_SEEDING_EVENT_TYPE } from 'src/common/constants';
import { SeederService } from 'src/common/seeders/seeders';
import { CustomerService } from 'src/microservices/customers/service/customer.service';
import { InventoryService } from 'src/microservices/inventory/services/inventory.service';
import { OrderService } from 'src/microservices/order/services/order.service';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Store } from 'src/model/store/entities/store.entity';
import * as moment from 'moment-timezone';
import { calculateDelay, delay } from 'src/utils/time.utils';
@Injectable()
export class SeedDataConsumer implements OnModuleInit {
	private consumer: Consumer;
	private readonly initial_time = KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME;
	private readonly schedule_time = KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME;
	private readonly seedingGroup = KAFKA_SEEDING_EVENT_TYPE.SEEDING_GROUP;

	constructor(
		private readonly kafka: Kafka,
		private readonly orderService: OrderService,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		private readonly customerService: CustomerService,
		private readonly inventoryService: InventoryService // private readonly storeService: SeederService,
	) {
		this.consumer = this.kafka.consumer({ groupId: this.seedingGroup });
	}

	async onModuleInit() {
		await this.consumeSchedulerInfo();
	}

	async consumeSchedulerInfo() {
		try {
			await this.consumer.connect();
			await this.consumer.subscribe({
				topic: this.initial_time,
				fromBeginning: true,
			});

			await this.consumer.subscribe({
				topic: this.schedule_time,
				fromBeginning: true,
			});

			await this.consumer.run({
				autoCommit: true,
				eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
					try {
						const seedingData = JSON.parse(message.value.toString());
						console.log(
							`Received seeding message: ${JSON.stringify(seedingData)}, ${topic}.${partition}`
						);

						const { eventType, companyId, storeId, posDataId, utcOffsetForStore } = seedingData;

						const storeData = await this.storeModel.findById(storeId);
						const companyData = await this.companyModel.findById(companyId);
						const posData: any = await this.posModel.findById(posDataId);
						const currentDate = new Date();

						const storeObject = {
							companyId: companyData._id,
							key: companyData.dataObject.key,
							clientId: companyData.dataObject.clientId,
							location: storeData.location,
							_id: storeData._id,
							lastSyncDataDuration: companyData.lastSyncDataDuration,
							timeZone: storeData.timeZone,
							name: companyData.name,
						};

						if (eventType === KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME) {
							// Check if the company has already been processed
							if (posData.name == 'flowhub') {
								console.log('Call type ' + eventType);
								console.log(
									'Start order process for ' +
										storeData?.locationName +
										' with ' +
										storeData.timeZone +
										' time zone'
								);
								await this.inventoryService.seedInventory(posData, storeObject);
								await this.customerService.seedCustomers(posData, storeObject);
								await this.orderService.processStoreData(storeObject, currentDate, posData);
								// await this.delay(intervalDuration);
							} else if (posData.name == 'dutchie') {
								// await this.storeService.seedDutchieStores(posData, storeObject);
								await this.inventoryService.seedDutchieInventory(posData, storeObject);
								await this.customerService.seedDutchieCustomers(posData, storeObject);
								await this.orderService.seedDutchieOrders(posData, storeObject);
								await this.orderService.seedDutchieStaff(posData, storeObject);
							}
						} else if (eventType === KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME) {
							const cronJobTime = new Date(
								new Date().toLocaleString('en-US', { timeZone: storeObject.timeZone })
							);
							const delayDuration = await calculateDelay(storeData.timeZone);
							console.log('delayDuration ' + delayDuration);

							delay(delayDuration)
								.then(async () => {
									if (posData.name == 'flowhub') {
										console.log(
											'Start order process for ' +
												storeData?.locationName +
												' with ' +
												storeData.timeZone +
												' time zone'
										);
										await this.orderService.processStoreData(storeObject, currentDate, posData);
									}
									if (posData.name == 'dutchie') {
										await this.inventoryService.seedDutchieInventory(posData, storeObject);
										await this.customerService.seedDutchieCustomers(posData, storeObject);
										await this.orderService.seedDutchieOrders(posData, storeObject);
										await this.orderService.seedDutchieStaff(posData, storeObject);
									} else {
										console.log('seedCustomers');
										await this.inventoryService.seedInventory(posData, storeObject);
										await this.customerService.seedCustomers(posData, storeObject);
									}
								})
								.catch((err) => {
									console.error('SCHEDULE_TIME error');
									console.error(err);
								});
						}

						console.log('==============================>');
						await this.consumer.commitOffsets([{ topic, partition, offset: message.offset }]);
					} catch (error) {
						console.error('Error processing campaign message:');
						console.log(error);
					}
				},
			});
		} catch (error) {
			console.error('Kafka consumer error:', error);
		}
	}
}
// Create the code
