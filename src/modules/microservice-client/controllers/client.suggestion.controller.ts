import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ClientSuggestionService } from '../services/client.suggestion.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';

@Controller('suggestion')
export class ClientSuggestionController {
	constructor(private readonly clientSuggestionService: ClientSuggestionService) {}

	@Get('list')
	async getSuggestionList() {
		try {
			const suggestions = await this.clientSuggestionService.suggestionList();
			return sendSuccess(suggestions);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}

	@Get()
	// @UseGuards(RolesGuard)
	// @Roles(USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN)
	async getSuggestion(
		@Query('storeId') storeId: string,
		@Query('id') id: string,
		@Query('page') page: number,
		@Query('limit') limit: number,
		@Query('filter') filter: string,
		@Query('text') text: string
	) {
		try {
			const suggestion = await this.clientSuggestionService.suggestion(
				storeId,
				id,
				page,
				limit,
				filter,
				text
			);
			return sendSuccess(suggestion);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}
}
