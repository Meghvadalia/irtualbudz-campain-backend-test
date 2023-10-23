import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ClientStoreService } from '../services/client.store.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { Request } from 'express';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';

@Controller('store')
export class ClientStoreController {
	constructor(private readonly clientStoreService: ClientStoreService) {}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(
		USER_TYPE.SUPER_ADMIN,
		USER_TYPE.ADMIN,
		USER_TYPE.COMPANY_ADMIN,
		USER_TYPE.STORE_ADMIN,
		USER_TYPE.MANAGER
	)
	async storeList(@Req() req: Request) {
		try {
			const storeList = await this.clientStoreService.getStores(req);
			return sendSuccess(storeList);
		} catch (error) {
			// throw new BadRequestException(error);
			return sendError(error.message, error.status);
		}
	}

	@Post('update/:posName')
	@UseGuards(RolesGuard)
	@Roles(
		USER_TYPE.SUPER_ADMIN,
		USER_TYPE.ADMIN,
		USER_TYPE.COMPANY_ADMIN,
		USER_TYPE.STORE_ADMIN,
		USER_TYPE.MANAGER
	)
	async updateStore(@Param('posName') posName: string) {
		try {
			const storeList = await this.clientStoreService.updateStoreData(posName);
			return sendSuccess(storeList);
		} catch (error) {
			console.log(error);
			return sendError(error.message, error.status);
		}
	}
}
