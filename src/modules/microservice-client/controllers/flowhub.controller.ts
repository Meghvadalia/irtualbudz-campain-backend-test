import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import mongoose, { Model } from 'mongoose';
import { KAFKA_SEEDING_EVENT_TYPE } from 'src/common/constants';
import { CustomerService } from 'src/microservices/customers';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Store } from 'src/model/store/entities/store.entity';
import { SeedDataProducer } from 'src/modules/kafka/producers/dataSeed.producer';
import { sendSuccess } from 'src/utils/request-response.utils';
import { calculateUtcOffset } from 'src/utils/time.utils';

@Controller('flowhub')
export class FlowhubController {
	constructor(
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService,
		private readonly customerService: CustomerService,
		private readonly seedDataProducer: SeedDataProducer,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Company.name) private companyModel: Model<Company>
	) {}

	@Get('seed')
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
		timeZone: 'UTC',
	})
	async seedData() {
		// await this.customerService.seedCustomers('flowhub');
		// await this.orderService.scheduleCronJob('flowhub');
		// await this.inventoryService.seedInventory('flowhub');
		console.log('Cron job call for flowhub/seed on ' + new Date().toISOString());

		const posData: IPOS = await this.posModel.findOne({
			name: 'flowhub',
		});
		const companiesList: ICompany[] = await this.companyModel.find<ICompany>({
			isActive: true,
			posId: posData._id,
		});

		const storeListsPromises = companiesList.map(async (companyData) => {
			return this.storeModel.find({
				companyId: companyData._id,
			});
		});

		const storeLists: any = await Promise.all(storeListsPromises);

		const combinedArray = [];
		for (let i = 0; i < companiesList.length; i++) {
			const companyData = companiesList[i];
			const storeList = storeLists[i];

			combinedArray.push(
				...storeList.map((storeData) => ({
					companyId: companyData._id,
					storeId: storeData._id,
					lastSyncDataDuration: companyData.lastSyncDataDuration,
					timeZone: storeData.timeZone,
				}))
			);
		}

		console.log('combinedArray');
		console.log(combinedArray.length);

		const processStoresParallel = async () => {
			await Promise.all(combinedArray.map(processStoreDataWithDelay));

			console.log('All stores processed');
		};
		const processStoreDataWithDelay = async (storeData) => {
			const cronJobTime = moment(
				new Date(new Date().toLocaleString('en-US', { timeZone: storeData.timeZone }))
			);
			const currentDate = moment(new Date());

			const utcOffsetForStore = calculateUtcOffset(storeData.timeZone);
			//const utcOffsetForStore = 1;
			console.log('TimeZone ' + storeData.timeZone + ' ' + storeData.locationName);
			console.log('cronJobTime ' + cronJobTime);
			console.log('currentDate ' + currentDate);

			// const delayMilliseconds = this.calculateDelay(cronJobTime, currentDate);
			console.log('delayMilliseconds');
			console.log(moment.duration(cronJobTime.diff(currentDate)).asSeconds());
			console.log('=============>>>>>>>>>>>>>>>>>>>>');
			// if (delayMilliseconds > 0) {
			this.seedDataProducer.sendSeedData(
				storeData.companyId,
				storeData.storeId,
				KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME,
				posData._id,
				utcOffsetForStore
			);
			// }
		};
		await processStoresParallel();
	}

	calculateDelay(startDate: Date, currentDate: Date): number {
		const delayMilliseconds = startDate.getTime() - currentDate.getTime();
		return delayMilliseconds > 0 ? delayMilliseconds : 0;
	}

	async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	@Get('seed-company-wise/:companyId')
	async seedCompanyWiseDate(
		@Param('companyId') companyId: string,
		@Query() query: { fromDate: string; toDate: string }
	) {
		try {
			const fromDate = new Date(query.fromDate);
			fromDate.setDate(fromDate.getDate() - 1);
			fromDate.setHours(0, 0, 0, 0);
			const toDate = new Date(query.toDate);
			toDate.setHours(0, 0, 0, 0);
			await this.orderService.syncCompanyWiseStoreData(
				fromDate,
				toDate,
				new mongoose.Types.ObjectId(companyId)
			);
			return sendSuccess({ message: 'Data Synced' });
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	// @Get('seed-customer')
	// async seedCustomerData() {
	// 	try {
	// 		await this.customerService.seedCustomers('flowhub');
	// 		return sendSuccess({ message: 'Data Synced' });
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw new Error(error);
	// 	}
	// }
}
