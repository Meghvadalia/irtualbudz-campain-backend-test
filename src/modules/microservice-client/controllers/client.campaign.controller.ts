import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ClientCampaignService } from '../services/client.campaign.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import mongoose from 'mongoose';
import { FILE_UPLOAD_LIMIT } from 'src/common/constants';
import { Cron, CronExpression } from '@nestjs/schedule';
@Controller('campaign')
export class ClientCampaignController {
	constructor(private readonly clientCampaignService: ClientCampaignService) {}

	@Post('create')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN, USER_TYPE.MANAGER)
	@UseInterceptors(FilesInterceptor('files', FILE_UPLOAD_LIMIT))
	async createCampaign(
		@Body() data,
		@UploadedFiles() files: Express.Multer.File[],
		@Req() req: Request
	) {
		try {
			const campaignData = await this.clientCampaignService.addCampaign(
				data,
				files,
				// @ts-ignore
				req.user.userId
			);
			return sendSuccess(campaignData);
		} catch (error) {
			console.error(error);
			return sendError(error.message, error.status);
		}
	}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(
		USER_TYPE.COMPANY_ADMIN,
		USER_TYPE.STORE_ADMIN,
		USER_TYPE.MANAGER,
		USER_TYPE.SUPER_ADMIN,
		USER_TYPE.ADMIN
	)
	async getCampaignList(
		@Req() req: Request,
		@Query('storeId') storeId: string,
		@Query('page') page: number,
		@Query('limit') limit: number,
		@Query('name') name: string
	) {
		try {
			// @ts-ignore
			const user = req.user;
			const campaignList = await this.clientCampaignService.campaignList(
				user,
				page,
				limit,
				storeId,
				name
			);
			return sendSuccess(campaignList);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Get('detail/:campaignId')
	@UseGuards(RolesGuard)
	@Roles(
		USER_TYPE.COMPANY_ADMIN,
		USER_TYPE.STORE_ADMIN,
		USER_TYPE.MANAGER,
		USER_TYPE.SUPER_ADMIN,
		USER_TYPE.ADMIN
	)
	async getCampaignDetails(@Param('campaignId') campaignId: string) {
		try {
			const campaignObjectId = new mongoose.Types.ObjectId(campaignId);
			const campaignList = await this.clientCampaignService.getCampaignDetail(campaignObjectId);
			return sendSuccess(campaignList);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Post('asset/upload')
	@UseGuards(RolesGuard)
	@Roles(
		USER_TYPE.SUPER_ADMIN,
		USER_TYPE.ADMIN,
		USER_TYPE.COMPANY_ADMIN,
		USER_TYPE.STORE_ADMIN,
		USER_TYPE.MANAGER
	)
	@UseInterceptors(FilesInterceptor('files', FILE_UPLOAD_LIMIT))
	async createCampaignAssets(@Body() data, @UploadedFiles() files: Express.Multer.File[]) {
		try {
			const campaignAsset = await this.clientCampaignService.uploadCampaignAsset(data, files);
			return sendSuccess(campaignAsset, 'Files successfully uploaded.');
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Delete('asset/remove/:id')
	async removeFiles(@Param('id') id: string) {
		try {
			const removeAsset = await this.clientCampaignService.removeFile(id);
			if (removeAsset) {
				return sendSuccess('File deleted successfully');
			} else {
				return sendError('An error occured while removing the file.', 500);
			}
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Get('asset/:campaignId')
	async getCampaignAssets(@Param('campaignId') campaignId: string) {
		try {
			const campaignAsset = await this.clientCampaignService.getAssets(campaignId);
			return sendSuccess(campaignAsset);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Delete('remove/:campaignId')
	@UseGuards(RolesGuard)
	@Roles(
		USER_TYPE.COMPANY_ADMIN,
		USER_TYPE.STORE_ADMIN,
		USER_TYPE.MANAGER,
		USER_TYPE.SUPER_ADMIN,
		USER_TYPE.ADMIN
	)
	async removeCampaignDetails(@Param('campaignId') campaignId: string) {
		try {
			const campaignObjectId = new mongoose.Types.ObjectId(campaignId);
			const campaignList = await this.clientCampaignService.removeCampaign(campaignObjectId);
			if (campaignList) {
				return sendSuccess('Campaign deleted successfully');
			} else {
				return sendError('An error occured while removing the campaign.', 500);
			}
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Post('email/send')
	async sendEmails(@Body() body: any) {
		try {
			const sendMails = await this.clientCampaignService.sendMail(body);
			return sendSuccess(sendMails);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Post('seedTrackingSubscriber')
	@UseGuards(RolesGuard)
	async seedTrackingSubscriber() {
		try {
			const seedList = await this.clientCampaignService.createTrackingListAndSubscribers();
			return sendSuccess(seedList);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}
}
