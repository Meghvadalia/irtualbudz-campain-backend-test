import { Controller, Get } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeederService } from 'src/common/seeders/seeders';
import { CustomerService } from 'src/microservices/customers';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';

@Controller('dutchie')
export class DutchieController {
	constructor(
		private readonly storeService: SeederService,
		private readonly customerService: CustomerService,
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService
	) {}

	@Get('seed')
	@Cron(CronExpression.EVERY_DAY_AT_5AM)
	async seedData() {
		await this.storeService.seedDutchieStores('dutchie');
		// await this.orderService.seedDutchieOrders('dutchie');
		// await this.customerService.seedDutchieCustomers('dutchie');
		// await this.orderService.seedDutchieStaff('dutchie');
		// await this.inventoryService.seedDutchieInventory('dutchie');
	}
}
