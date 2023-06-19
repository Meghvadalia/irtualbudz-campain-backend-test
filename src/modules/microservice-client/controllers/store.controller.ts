import { Controller, Get, UseGuards } from '@nestjs/common';
import { StoreService } from '../services/store.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user';

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
