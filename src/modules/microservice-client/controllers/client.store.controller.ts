import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ClientStoreService } from '../services/client.store.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { Request } from 'express';

@Controller('store')
export class ClientStoreController {
	constructor(private readonly clientStoreService: ClientStoreService) {}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN, USER_TYPE.MANAGER)
	async storeList(@Req() req: Request) {
		try {
			return await this.clientStoreService.getStores(req);
		} catch (error) {
			throw new Error(error);
		}
	}
}
