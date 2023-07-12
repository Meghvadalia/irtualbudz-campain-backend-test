import { Controller, Get } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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
	@Cron('0 0 0 * * *')
	async seedData() {
		await this.storeService.seedDutchieStores('dutchie');
		// await this.orderService.seedDutchieOrders('dutchie');
		// await this.customerService.seedDutchieCustomers('dutchie');
		// await this.orderService.seedDutchieStaff('dutchie');
		// await this.inventoryService.seedDutchieInventory('dutchie');
	}
}
