import { Controller, Get } from '@nestjs/common';
import { ClientStoreService } from '../services/client.store.service';

@Controller('store')
export class StoreController {
	constructor(private readonly clientStoreService: ClientStoreService) {}

	@Get('seed-stores')
	async seedStoreList() {
		try {
			return await this.clientStoreService.seedStoreData();
		} catch (error) {
			throw new Error(error);
		}
	}
}
