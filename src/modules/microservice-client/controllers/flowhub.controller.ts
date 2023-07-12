import { Controller, Get } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomerService } from 'src/microservices/customers';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';

@Controller('flowhub')
export class FlowhubController {
	constructor(
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService,
		private readonly customerService: CustomerService
	) {}

	@Get('seed')
	@Cron('0 0 0 * * *')
	async seedData() {
		await this.customerService.seedCustomers('flowhub');
		await this.orderService.scheduleCronJob('flowhub');
		await this.inventoryService.seedInventory('flowhub');
	}
}
