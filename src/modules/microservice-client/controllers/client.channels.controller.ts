import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClientChannelService } from '../services/client.channels.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { ChannelDto } from 'src/model/channels/dto/channel.dto';

@Controller('channel')
export class ClientChannelController {
	constructor(private readonly clientChannelService: ClientChannelService) {}

	@Get('list')
	async listChannels() {
		try {
			const channels = await this.clientChannelService.getAllChannels();
			return sendSuccess(channels);
		} catch (error) {
			console.error('Error:' +error.message);
			return sendError(error.message, error.status);
		}
	}

	@Post('add')
	async addChannel(@Body() data: ChannelDto) {
		try {
			const channel = await this.clientChannelService.addChannel(data);
			return sendSuccess(channel, 'Channel added successfully');
		} catch (error) {
			console.error('Error:' +error.message);
			return sendError(error.message, error.status);
		}
	}
}
