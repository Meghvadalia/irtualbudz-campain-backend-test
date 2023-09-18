import { Controller, Get, Param } from '@nestjs/common';
import { ClientCampaignTypeService } from '../services/client.campaignTypes.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';

@Controller('campaign_type')
export class ClientCampaignTypeController {
	constructor(private readonly clientCampaignTypeService: ClientCampaignTypeService) {}

	@Get('/list')
	async getCampaignTypes() {
		try {
			const campaignType = await this.clientCampaignTypeService.getCampaignTypes();
			return sendSuccess(campaignType);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}
}
