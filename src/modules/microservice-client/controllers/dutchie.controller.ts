import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { KAFKA_SEEDING_EVENT_TYPE } from 'src/common/constants';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Store } from 'src/model/store/entities/store.entity';
import { SeedDataProducer } from 'src/modules/kafka/producers/dataSeed.producer';
import { calculateUtcOffset } from 'src/utils/time.utils';

@Controller('dutchie')
export class DutchieController {
	constructor(
		private readonly seedDataProducer: SeedDataProducer,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>
	) {}

	@Get('seed')
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
		timeZone: 'UTC',
	})
	async seedData() {
		const seedValue = 'dutchie';
		console.log('Cron job call for dutchie/seed on ' + new Date().toISOString());

		const posData: IPOS = await this.posModel.findOne({
			name: seedValue,
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
			console.log('storeData.timeZone' + JSON.stringify(storeData));
			const utcOffsetForStore = calculateUtcOffset(storeData.timeZone);
			// const utcOffsetForStore = 1;
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
				KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME,
				posData._id,
				utcOffsetForStore
			);
			// }
		};
		await processStoresParallel();
	}
}
