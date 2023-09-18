import { Controller, Get } from '@nestjs/common';
import { ClientActionService } from '../services/client.action.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';

@Controller('action')
export class ClientActionController {
	constructor(private readonly clientActionService: ClientActionService) {}

	@Get('list')
	async actionsList() {
		try {
			const actions = await this.clientActionService.getActionList();
			return sendSuccess(actions);
		} catch (error) {
			console.error('Error fetching actions List', error.message);
			return sendError(error.message, error.status);
		}
	}

	@Get('non_trackable')
	async nonTrackableActions() {
		try {
			const actions = await this.clientActionService.nonTrackableActionList();
			return sendSuccess(actions);
		} catch (error) {
			console.error('Error fetching actions List', error.message);
			return sendError(error.message, error.status);
		}
	}
}
