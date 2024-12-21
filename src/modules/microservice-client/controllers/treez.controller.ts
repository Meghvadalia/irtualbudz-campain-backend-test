import { Controller, Get } from '@nestjs/common';
import { TreezService } from '../services/treez.service';
import { sendSuccess } from 'src/utils/request-response.utils';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { Model } from 'mongoose';
import { POS } from 'src/model/pos/entities/pos.entity';
import { SeedDataProducer } from 'src/modules/kafka/producers/dataSeed.producer';
import { KAFKA_TREEZ_EVENT_TYPE } from 'src/common/constants';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('treez')
export class TreezColtroller {
	constructor(
		private readonly treezService: TreezService,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		private readonly seedDataProducer: SeedDataProducer
	) {}

	@Get('seed')
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
		timeZone: 'UTC',
	})
	async seedTreezData() {
		const POS = 'treez';
		const token = await this.treezService.authAccessToken();

		const posData: IPOS = await this.posModel.findOne({
			name: POS,
		});
		const companiesList: ICompany[] = await this.companyModel.find<ICompany>({
			isActive: true,
			posId: posData._id,
		});

		console.log(`${companiesList.length} Company Founded in POS ${POS}`);
		for (const company of companiesList) {
			// this.seedDataProducer.sendSeedData(
			// 	company._id,
			// 	'',
			// 	KAFKA_TREEZ_EVENT_TYPE.TREEZ_INITIAL_TIME,
			// 	posData._id,
			// 	1000,
			// 	token
			// );
			const customer = await this.treezService.syncCustomerFromTreez(posData,token,company);
		const Orders = await this.treezService.syncOrederFromTreez(posData,token,company);
		const product = await this.treezService.syncProductFromTreez(posData,token,company);
		}

		return sendSuccess(null, 'Customers get successfully');
	}
}
