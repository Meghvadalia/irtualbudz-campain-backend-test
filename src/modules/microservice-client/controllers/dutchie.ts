import { Controller, Get } from '@nestjs/common';
import { CustomerService } from 'src/microservices/customers';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';

@Controller('dutchie')
export class DutchieDataSeeder {
	constructor(
		private readonly customerService: CustomerService,
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService
	) {}

	@Get('seed')
	async seedData() {
		// await this.customerService.seedDutchieCustomers();
		// await this.orderService.seedDutchieStaff();
		await this.inventoryService.seedDutchieInventory();
	}
}
