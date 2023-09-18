import { Controller, Get, Post } from '@nestjs/common';
import { ClientGraphService } from '../services/client.graph.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';

@Controller('graph')
export class ClientGraphController {
	constructor(private readonly clientGraphService: ClientGraphService) {}

	@Post('updateAllGraph')
	async updateAllGraph() {
		try {
			const graph = await this.clientGraphService.updateGraphByName();
			return sendSuccess(graph);
		} catch (error) {
			console.error(error.message);
			return sendError(error.message, error.status);
		}
	}
}
