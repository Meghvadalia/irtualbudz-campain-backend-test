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

@Controller('dopecast')
export class ClientDopeCastController {
	constructor(
		private readonly clientcompanyService: ClientCompanyService,
		private readonly dashboardService: ClientDashboardService,
		private readonly clientPosService: ClientPosService,
		private readonly clientStoreService: ClientStoreService
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
	/**
	 * Creates a new store using the provided data transfer object (DTO).
	 *
	 * @param createStoreDto - The data transfer object containing the details of the store to be created.
	 * @returns A promise that resolves to the created store list.
	 * @throws Will throw an error if the store creation fails.
	 */
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

	@Get('store/companyStoreList/:companyId')
	/**
	 * Handles the request to list stores.
	 *
	 * @param req - The request object containing the necessary parameters.
	 * @returns A promise that resolves to the list of stores or an error response.
	 *
	 * @throws Will throw an error if the store listing fails.
	 */
	async listStore(@Req() req: Request) {
		try {
			const storeList = await this.clientStoreService.listStore(req);
			return sendSuccess(storeList);
		} catch (error) {
			console.log(error);
			return sendError(error.message, error.status);
		}
	}
	@Get('store/getStoreWiseBrand/:storeId')
	/**
	 * Retrieves a list of brands associated with stores based on the request parameters.
	 *
	 * @param req - The request object containing necessary parameters for fetching store-wise brands.
	 * @returns A promise that resolves to a success response containing the list of store-wise brands,
	 *          or an error response in case of failure.
	 * @throws Will throw an error if the operation fails.
	 */
	async getStoreWiseBrand(@Req() req: Request) {
		try {
			const storeList = await this.clientStoreService.getStoreWiseBrand(req);
			return sendSuccess(storeList);
		} catch (error) {
			console.log(error);
			return sendError(error.message, error.status);
		}
	}
}
