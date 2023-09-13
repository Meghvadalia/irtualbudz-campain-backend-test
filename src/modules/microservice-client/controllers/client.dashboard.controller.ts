import {
	Controller,
	Get,
	Param,
	Query,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common';
import { ClientDashboardService } from '../services/client.dashboard.service';
import { Response } from 'express';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';

import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import mongoose from 'mongoose';
import { sendSuccess } from 'src/utils/request-response.utils';

@Controller('dashboard')
export class ClientDashboardController {
	constructor(private readonly dashboardService: ClientDashboardService) {}

	@Get('/:locationId')
	@UseGuards(RolesGuard)
	@Roles(
		USER_TYPE.SUPER_ADMIN,
		USER_TYPE.ADMIN,
		USER_TYPE.COMPANY_ADMIN,
		USER_TYPE.STORE_ADMIN,
		USER_TYPE.MANAGER
	)
	async getCalculatedData(
		@Req() req,
		@Param('locationId') locationId: string,
		@Query() query: { fromDate: string; toDate: string }
	) {
		try {
			const objectId = new mongoose.Types.ObjectId(locationId);
			const { customer, overview, sales, operations } =
				await this.dashboardService.getCalculatedData(
					req,
					objectId,
					query
				);

			return sendSuccess({ overview, customer, sales, operations });
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
}
