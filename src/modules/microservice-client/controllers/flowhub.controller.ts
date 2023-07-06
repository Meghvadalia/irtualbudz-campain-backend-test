import { Controller, Get } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';
import { ClientStoreService } from '../services/client.store.service';

@Controller('flowhub')
export class FlowhubController {
	constructor(
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService,
		private readonly storeService: ClientStoreService
	) {}

	@Get('seed')
	@Cron('0 0 0 * * *')
	async seedData() {
		await this.storeService.seedStoreData('flowhub');
		await this.orderService.scheduleCronJob('flowhub');
		await this.inventoryService.seedInventory('flowhub');
	}
}
