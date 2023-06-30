import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClientStoreService } from '../services/client.store.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';

@Controller('store')
export class ClientStoreController {
	constructor(private readonly clientStoreService: ClientStoreService) {}

	async seedStoreList() {
		try {
			return await this.clientStoreService.seedStoreData();
		} catch (error) {
			throw new Error(error);
		}
	}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.ADMIN)
	async storeList() {
		try {
			return await this.clientStoreService.getStores();
		} catch (error) {
			throw new Error(error);
		}
	}
}
