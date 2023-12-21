import { Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InventoryService } from '../services/inventory.service';
import { sendSuccess } from 'src/utils/request-response.utils';

@Controller('inventory')
export class InventoryController {
	constructor(private readonly inventoryService: InventoryService) {}

	@GrpcMethod('InventoryService', 'getInventory')
	getInventory(data: any): any {
		try {
			console.log('get Method Called', data);
			return { surname: 78 };
		} catch (error) {
			console.error('GRPC METHOD', error);
		}
	}

	@Get('seed')
	async seedInventoryData() {
		try {
			// await this.inventoryService.seedInventory('flowhub');
		} catch (error) {
			throw new Error(error);
		}
	}

	@Get('migrate')
	migrateData() {
		try {
			this.inventoryService.migrateData();
			return sendSuccess('Migration has been completed.');
		} catch (error) {
			throw new Error(error);
		}
	}
}
