import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ClientNotificationService } from '../services/client.notification.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { Request } from 'express';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('notification')
export class ClientNotificationController {
	constructor(private readonly clientNotificationService: ClientNotificationService) {}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN, USER_TYPE.MANAGER)
	async listNotification(@Req() req: Request, @Query('page') page: number, @Query('limit') limit: number) {
		try {
			// @ts-ignore
			const user = req.user;
			console.log(user);
			const notification = await this.clientNotificationService.listAllNotification(user, page, limit);
			return sendSuccess(notification);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_7AM)
	// @Get('seed')
	// @UseGuards(RolesGuard)
	// @Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN, USER_TYPE.MANAGER)
	async seedNotifications() {
		try {
			const notification = await this.clientNotificationService.getNotificationArrayList();
			let notificationList = notification.filter((obj) => obj !== null && obj !== undefined);
			if (notificationList.length > 0) {
				return sendSuccess(await this.clientNotificationService.insertStoreWiseNotification(notificationList));
			}
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Post('migration')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN, USER_TYPE.MANAGER)
	async seedNotificationsMigtation() {
		try {
			const notification = await this.clientNotificationService.migrationScriptForNotification();
			
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}
}
