import { Controller, Get, Param, Post, Req, UseGuards, Query, Body } from '@nestjs/common';
import { ClientPosService } from '../services/client.pos.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { Payload } from '@nestjs/microservices';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { ClientCompanyService } from '../services/client.company.service';
import { ClientDashboardService } from '../services/client.dashboard.service';
import mongoose, { Types } from 'mongoose';
import { ClientStoreService } from '../services/client.store.service';
import { JoiValidationPipe } from 'src/utils/JoiValidationPipe';
import { CreateStoreSchema } from 'src/common/validator/store.validator';
import { CreateStoreDto } from 'src/model/store/interface/store.inteface';
import { ICompanyRequest } from 'src/model/company/interface/company.interface';
import { CreateCompanySchema } from 'src/common/validator/company.validator';
import { MaryJaneService } from '../services/client.maryJane.services';
import { MARY_JANE_DASHBOARD } from 'src/common/constants';

@Controller('mary-jane')
export class ClientMaryJaneController {
	constructor(
		private readonly clientcompanyService: ClientCompanyService,
		private readonly dashboardService: ClientDashboardService,
		private readonly clientPosService: ClientPosService,
		private readonly clientStoreService: ClientStoreService,
		private readonly maryJaneService: MaryJaneService
	) {}
	@Get()
	async getParentRoute() {}

	@Get('company/list')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN)
	async companies(@Req() req: Request) {
		try {
			return await this.clientcompanyService.companyList(req);
		} catch (error) {
			// throw new BadRequestException(error.details);
			return sendError(error.message, error.status);
		}
	}

	@Post('company/create')
	async createCompany(
		@Body(new JoiValidationPipe(CreateCompanySchema)) createCompanyDto: ICompanyRequest
	) {
		try {
			return await this.clientcompanyService.createCompany(createCompanyDto);
		} catch (error) {
			// throw new BadRequestException(error.details);
			return sendError(error.message, error.status);
		}
	}

	//DashBoard Routes

	@Get('dashboard/:locationId')
	@UseGuards(RolesGuard)
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
			const campaignId = query.campaignId
				? new mongoose.Types.ObjectId(query.campaignId)
				: query.campaignId;
			const audienceTracking = query.trackAudience;
			const maryJaneQuery = {
				topUsedCouponLimit: MARY_JANE_DASHBOARD.TOP_USED_COUPONS,
				topDiscountedProductLimit: MARY_JANE_DASHBOARD.TOP_DISCOUNTED_PRODUCT,
				brandWiseSalesDataLimit: MARY_JANE_DASHBOARD.BRAND_WISE_SALES_DATA
			};
			const { customer, overview, sales, operations, graphAndSummaryData } =
				await this.dashboardService.getCalculatedData(
					objectId,
					query,
					campaignId,
					audienceTracking,
					maryJaneQuery
				);
			
			const calculatedSalesData = await this.maryJaneService.calculateSalesData(
				objectId,
				query.fromDate,
				query.toDate,
			);			  

			return sendSuccess({
				overview,
				customer,
				sales: { ...sales, ...calculatedSalesData},
				operations,
				graphAndSummaryData,
			});
		} catch (error) {
			console.log(error);
			// throw new BadRequestException(error);
			return sendError(error.message, error.status);
		}
	}

	//POS

	@Get('pos/list')
	@UseGuards(RolesGuard)
	async pos(@Req() req: Request) {
		try {
			return await this.clientPosService.posList(req);
		} catch (error) {
			return sendError(error.message, error.status);
		}
	}

	// Store

	@Post('store/create')
	async createStore(
		@Body(new JoiValidationPipe(CreateStoreSchema)) createStoreDto: CreateStoreDto
	) {
		try {
			const storeList = await this.clientStoreService.createStore(createStoreDto);
			return sendSuccess(storeList);
		} catch (error) {
			console.log(error);
			return sendError(error.message, error.status);
		}
	}
}
