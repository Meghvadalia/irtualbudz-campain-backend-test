import { BadGatewayException, Controller, Get } from '@nestjs/common';
import { ClientGoalsService } from '../services/client.goals.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';

@Controller('goals')
export class ClientGoalsController {
	constructor(private readonly clientGoalsService: ClientGoalsService) {}

	@Get('list')
	async listGoals() {
		try {
			const goals = await this.clientGoalsService.listAllGoals();
			return sendSuccess(goals);
		} catch (error) {
			console.error(error.message);
			// throw new BadGatewayException(error.details)
			return sendError(error.message, error.status);
		}
	}
}
