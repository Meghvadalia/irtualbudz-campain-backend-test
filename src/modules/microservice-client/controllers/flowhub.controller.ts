import { Controller, Get, Param, Query } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import mongoose from 'mongoose';
import { KAFKA_SEEDING_EVENT_TYPE } from 'src/common/constants';
import { CustomerService } from 'src/microservices/customers';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';
import { SeedDataProducer } from 'src/modules/kafka/producers/dataSeed.producer';
import { sendSuccess } from 'src/utils/request-response.utils';

@Controller('flowhub')
export class FlowhubController {
	constructor(
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService,
		private readonly customerService: CustomerService,
		private readonly seedDataProducer: SeedDataProducer
	) {}

	@Get('seed')
	@Cron(CronExpression.EVERY_12_HOURS)
	async seedData() {
		// await this.customerService.seedCustomers('flowhub');
		// await this.orderService.scheduleCronJob('flowhub');
		// await this.inventoryService.seedInventory('flowhub');
		await this.seedDataProducer.sendSeedData('flowhub', KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME);
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

	@Get('seed-customer')
	async seedCustomerData() {
		try {
			// await this.customerService.seedCustomers('flowhub');
			return sendSuccess({ message: 'Data Synced' });
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
}
