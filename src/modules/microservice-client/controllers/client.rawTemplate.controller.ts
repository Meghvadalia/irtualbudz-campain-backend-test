import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { ClientRawTemplateService } from '../services/client.rawTemplate.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('raw_template')
export class ClientRawTemplateController {
	constructor(private readonly clientRawTemplateService: ClientRawTemplateService) {}

	@UseGuards(RolesGuard)
	// @Roles(USER_TYPE.ADMIN)
	@UseInterceptors(FilesInterceptor('file', 1))
	@Post('create')
	async saveTemplate(@Body() data, @UploadedFiles() file: Express.Multer.File) {
		try {
			const template = await this.clientRawTemplateService.saveTemplate(data, file);
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error creating template ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@Get('detail/:id')
	async getTemplateDetail(@Param('id') id: string) {
		try {
			const template = await this.clientRawTemplateService.getTemplate(id);
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error fetching template ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@Get('list')
	async templateList() {
		try {
			const templates = await this.clientRawTemplateService.getTemplates();
			return sendSuccess(templates);
		} catch (error) {
			console.error(`Error fetching template list ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@Get('itemCount/:number')
	async getTemplatesByItemCount(@Param('number') number: string) {
		try {
			const template = await this.clientRawTemplateService.getTemplateByItemCount(+number);
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error fetching template based on item count ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.ADMIN)
	@Patch('update/:id')
	async updateTemplate(@Param('id') id: string, @Body() data) {
		try {
			const template = await this.clientRawTemplateService.updateTemplate(id, data);
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error updating template ${error.message}`);
			return sendError(error.message, error.status);
		}
	}

	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.ADMIN)
	@Delete('remove/:id')
	async removeTemplate(@Param('id') id: string) {
		try {
			const template = await this.clientRawTemplateService.deleteTemplate(id);
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error deleteing template ${error.message}`);
			return sendError(error.message, error.status);
		}
	}
	@UseGuards(RolesGuard)
	@UseInterceptors(FilesInterceptor('file', 1))
	@Post('createUpload')
	async uploadImageWithPathFun(@Body() data, @UploadedFiles() file: Express.Multer.File) {
		try {
			// Add validation for 'data' and 'file' if necessary

			console.log('Received file:', file);
			console.log('Data:', data);

			// Handle file processing here using services or logic
			const template = await this.clientRawTemplateService.uploadImageWithPath(data.path, file);

			// Return success response with processed data
			return sendSuccess(template);
		} catch (error) {
			console.error(`Error uploading file: ${error.message}`);
			// Improve error handling, return appropriate error response
			return sendError(error.message, error.status || 500);
		}
	}
}
