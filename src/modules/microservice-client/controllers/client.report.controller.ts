import {
	BadRequestException,
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
import mongoose, { Types } from 'mongoose';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { ClientReportService } from '../services/client.report.service';

@Controller('report')
export class ClientReportController {
	constructor(private readonly clientReportService: ClientReportService) {}

	@Get('/:campaignId')
	// @UseGuards(RolesGuard)
	// @Roles(
	// 	USER_TYPE.SUPER_ADMIN,
	// 	USER_TYPE.ADMIN,
	// 	USER_TYPE.COMPANY_ADMIN,
	// 	USER_TYPE.STORE_ADMIN,
	// 	USER_TYPE.MANAGER
	// )
	async getReportData(@Param('campaignId') campaignId: string) {
		try {
			let data = await this.clientReportService.getAllReportData(campaignId);
			return sendSuccess(data);
		} catch (error) {
			console.log(error);
			// throw new BadRequestException(error);
			return sendError(error.message, error.status);
		}
	}

	@Get('campaignList/:brandId')
	// @UseGuards(RolesGuard)
	// @Roles(
	// 	USER_TYPE.SUPER_ADMIN,
	// 	USER_TYPE.ADMIN,
	// 	USER_TYPE.COMPANY_ADMIN,
	// 	USER_TYPE.STORE_ADMIN,
	// 	USER_TYPE.MANAGER
	// )
	async getTrackingCampaign(@Param('brandId') brandId: string) {
		try {
			console.log(brandId);
			let data = await this.clientReportService.getTrackingCampaign(brandId);
			return sendSuccess(data);
		} catch (error) {
			console.log(error);
			// throw new BadRequestException(error);
			return sendError(error.message, error.status);
		}
	}
}
