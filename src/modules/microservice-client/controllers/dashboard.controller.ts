import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { Response } from 'express';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';

import { USER_TYPE } from 'src/microservices/user';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get('/:locationId')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.ADMIN)
	async getCalculatedData(
		@Param('locationId') locationId: string,
		@Query() query: { fromDate: string; toDate: string },
		@Res() res: Response
	) {
		try {
			const { customer, overview, sales, operations } = await this.dashboardService.getCalculatedData(locationId, query);

			return res.json({ overview, customer, sales, operations });
		} catch (error) {
			throw new Error(error);
		}
	}
}
