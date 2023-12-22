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

						const { eventType, POSName } = seedingData;
						const posData: IPOS = await this.posModel.findOne({
							name: POSName,
						});
						const companiesList: ICompany[] = await this.companyModel.find<ICompany>({
							isActive: true,
							posId: posData._id,
						});

						const currentDate = new Date();

						const storeListsPromises = companiesList.map(async (companyData) => {
							return this.storeModel.find({
								companyId: companyData._id,
							});
						});

						const storeLists = await Promise.all(storeListsPromises);

						const combinedArray = [];
						const intervalDuration = 2000;
						for (let i = 0; i < companiesList.length; i++) {
							const companyData = companiesList[i];
							const storeList = storeLists[i];

							combinedArray.push(
								...storeList.map((storeData) => ({
									companyId: companyData._id,
									key: companyData.dataObject.key,
									clientId: companyData.dataObject.clientId,
									location: storeData.location,
									_id: storeData._id,
									lastSyncDataDuration: companyData.lastSyncDataDuration,
									timeZone: storeData.timeZone,
									name: companyData.name,
								}))
							);
						}
						const companyList = [];

						console.log('combinedArray');
						console.log(combinedArray.length);

						const processStoresParallel = async () => {
							await Promise.all(combinedArray.map(processStoreDataWithDelay));

							console.log('All stores processed');
						};

						const processStoreDataWithDelay = async (storeData) => {
							if (eventType === KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME) {
								// Check if the company has already been processed
								if (POSName == 'flowhub') {
									await this.orderService.processStoreData(storeData, currentDate, posData);
								}
								if (companyList.findIndex((x) => x == storeData.companyId) == -1) {
									companyList.push(storeData.companyId);
									if (POSName == 'dutchie') {
										// await this.storeService.seedDutchieStores(storeData, posData);
										await this.orderService.seedDutchieStaff(storeData, posData);
										await this.inventoryService.seedDutchieInventory(storeData, posData);
										await this.customerService.seedDutchieCustomers(storeData, posData);
										await this.orderService.seedDutchieOrders(storeData, posData);
										await this.delay(intervalDuration);
									} else {
										await this.inventoryService.seedInventory(posData, storeData);
										await this.customerService.seedCustomers(posData, storeData);
										await this.delay(intervalDuration);
									}
								}
							} else if (eventType === KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME) {
								const cronJobTime = new Date(
									new Date().toLocaleString('en-US', { timeZone: storeData.timeZone })
								);
								console.log('store timeZone');
								console.log(storeData.timeZone);
								console.log('cronJobTime');
								console.log(cronJobTime);
								console.log('currentDate');
								console.log(currentDate);
								const delayMilliseconds = this.calculateDelay(cronJobTime, currentDate);
								console.log('delayMilliseconds');
								console.log(delayMilliseconds);
								if (delayMilliseconds > 0) {
									await this.delay(delayMilliseconds);
									if (POSName == 'flowhub')
										await this.orderService.processStoreData(storeData, currentDate, posData);
									if (companyList.findIndex((x) => x == storeData.companyId) == -1) {
										companyList.push(storeData.companyId);
										if (POSName == 'dutchie') {
											// await this.storeService.seedDutchieStores(storeData,posData);
											await this.orderService.seedDutchieStaff(storeData, posData);
											await this.inventoryService.seedDutchieInventory(storeData, posData);
											await this.customerService.seedDutchieCustomers(storeData, posData);
											await this.orderService.seedDutchieOrders(storeData, posData);
										} else {
											await this.inventoryService.seedInventory(posData, storeData);
											await this.customerService.seedCustomers(posData, storeData);
										}
									}
								}
							}
						};

						await processStoresParallel();

						await this.consumer.commitOffsets([{ topic, partition, offset: message.offset }]);
					} catch (error) {
						console.error('Error processing campaign message:');
						console.error(error);
					}
				},
			});
		} catch (error) {
			console.error('Kafka consumer error:', error);
		}
	}

	calculateDelay(startDate: Date, currentDate: Date): number {
		const delayMilliseconds = startDate.getTime() - currentDate.getTime();
		return delayMilliseconds > 0 ? delayMilliseconds : 0;
	}

	async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
