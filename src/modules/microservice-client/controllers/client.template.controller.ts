import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { ClientTemplateService } from '../services/client.template.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
@Controller('template')
export class ClientTemplateController {
	constructor(private readonly clientTemplateService: ClientTemplateService) {}

	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN)
	@Get('detail/:id')
	async getTemplateDetail(@Param('id') id: string) {
		try {
			const template = await this.clientTemplateService.getTemplate(id);
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error creating template ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN)
	@Get('campaign/:campaignId')
	async templateListByCampaignId(@Param('campaignId') campaignId: string, @Req() req: Request) {
		try {
			// @ts-ignore
			const user = req.user;
			const templates = await this.clientTemplateService.getTemplateByCampaignId(campaignId);
			return sendSuccess(templates);
		} catch (error) {
			console.error(`Error fetching template list ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN)
	@Patch('update/:id')
	async updateTemplate(@Param('id') id: string, @Body() data, @Req() req: Request) {
		try {
			// @ts-ignore
			const user = req.user;
			const template = await this.clientTemplateService.updateTemplate(id, data, user.userId);
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error updating template ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	// @UseGuards(RolesGuard)
	// @Roles(USER_TYPE.ADMIN)
	@Post('message')
	async generateOpenAiMessage(@Body() data: { message: string[]; type: string }) {
		try {
			const templates = await this.clientTemplateService.generateMessage(data.type, data.message);
			return sendSuccess(templates);
		} catch (error) {
			console.error(`Error fetching template list ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN)
	@Patch('sendTemplate')
	async updateAndSendTemplate(@Param('id') id: string, @Body() data, @Req() req: Request) {
		try {
			// @ts-ignore
			const user = req.user;

			// return sendSuccess(template);
		} catch (error) {
			console.error(`Error updating template ${error.message}`);
			return sendError(error.message, error.status);
		}
	}
}
