import { Controller, Get } from '@nestjs/common';
import { StoreService } from '../services/store.service';

@Controller('store')
export class StoreController {
	constructor(private readonly clientStoreService: StoreService) {}

	@Get('seed-stores')
	async seedStoreList() {
		try {
			return await this.clientStoreService.seedStoreData();
		} catch (error) {
			throw new Error(error);
		}
	}
}
