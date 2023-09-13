import { Controller, Get, Param, Query } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import mongoose from 'mongoose';
import { CustomerService } from 'src/microservices/customers';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';
import { sendSuccess } from 'src/utils/request-response.utils';

@Controller('flowhub')
export class FlowhubController {
	constructor(
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService,
		private readonly customerService: CustomerService
	) {}

	@Get('seed')
	@Cron(CronExpression.EVERY_DAY_AT_5AM)
	async seedData() {
		await this.customerService.seedCustomers('flowhub');
		await this.orderService.scheduleCronJob('flowhub');
		await this.inventoryService.seedInventory('flowhub');
	}

	@Get('seed-company-wise/:companyId')
	async seedCompanyWiseDate(
		@Param('companyId') companyId: string,
		@Query() query: { fromDate: string; toDate: string }
	) {
		try {
			let fromDate = new Date(query.fromDate);
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
}
