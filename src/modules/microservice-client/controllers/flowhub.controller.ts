import { Controller, Get } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';

@Controller('flowhub')
export class FlowhubController {
	constructor(private readonly orderService: OrderService, private readonly inventoryService: InventoryService) {}

	@Get('seed')
	@Cron('0 0 0 * * *')
	async seedData() {
		await this.orderService.scheduleCronJob();
		await this.inventoryService.seedInventory();
	}
}
