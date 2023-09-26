import { BadRequestException, Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ClientDashboardService } from '../services/client.dashboard.service';
import { Response } from 'express';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';

import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import mongoose, { Types } from 'mongoose';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';

@Controller('dashboard')
export class ClientDashboardController {
	constructor(private readonly dashboardService: ClientDashboardService) {}

	@Get('/:locationId')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN, USER_TYPE.MANAGER)
	async getCalculatedData(
		@Param('locationId') locationId: string,
		@Query()
		query: {
			fromDate: string;
			toDate: string;
			goalFlag?: string;
			campaignId?: Types.ObjectId | undefined;
			trackAudience?: boolean;
		}
	) {
		try {
			const objectId = new mongoose.Types.ObjectId(locationId);
			const campaignId = query.campaignId ? new mongoose.Types.ObjectId(query.campaignId) : query.campaignId;
			const audienceTracking = query.trackAudience;
			const { customer, overview, sales, operations, graphAndSummaryData } = await this.dashboardService.getCalculatedData(
				objectId,
				query,
				campaignId,
				audienceTracking
			);

			return sendSuccess({ overview, customer, sales, operations, graphAndSummaryData });
		} catch (error) {
			console.log(error);
			// throw new BadRequestException(error);
			return sendError(error.message, error.status);
		}
	}
}
