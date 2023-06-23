import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { Response } from 'express';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';

import { sendSuccess } from 'src/utils/request-response.utils';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get('/:locationId')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.ADMIN)
	async getCalculatedData(@Param('locationId') locationId: string, @Query() query: { fromDate: string; toDate: string }) {
		try {
			const { customer, overview, sales, operations } = await this.dashboardService.getCalculatedData(locationId, query);

			return sendSuccess({ overview, customer, sales, operations });
		} catch (error) {
			throw new Error(error);
		}
	}
}
