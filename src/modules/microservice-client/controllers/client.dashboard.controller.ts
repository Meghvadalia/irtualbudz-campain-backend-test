import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ClientDashboardService } from '../services/client.dashboard.service';
import { Response } from 'express';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';

import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import mongoose from 'mongoose';

@Controller('dashboard')
export class ClientDashboardController {
	constructor(private readonly dashboardService: ClientDashboardService) {}

	@Get('/:locationId')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN)
	async getCalculatedData(
		@Param('locationId') locationId: string,
		@Query() query: { fromDate: string; toDate: string },
		@Res() res: Response
	) {
		try {
			const objectId = new mongoose.Types.ObjectId(locationId);
			const { customer, overview, sales, operations } = await this.dashboardService.getCalculatedData(objectId, query);

			return res.json({ overview, customer, sales, operations });
		} catch (error) {
			throw new Error(error);
		}
	}
}
