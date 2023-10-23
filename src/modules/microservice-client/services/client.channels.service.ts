import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChannelDto } from 'src/model/channels/dto/channel.dto';
import { Channel } from 'src/model/channels/entities/channel.entity';
import { IChannel } from 'src/model/channels/interface/channel.interface';
import { dynamicCatchException, throwNotFoundException } from 'src/utils/error.utils';

@Injectable()
export class ClientChannelService {
	constructor(@InjectModel(Channel.name) private readonly channelModel: Model<Channel>) {}

	async getAllChannels(): Promise<IChannel[]> {
		try {
			const channelList = await this.channelModel.find<IChannel>({}, { name: 1, _id: 1 });
			if (channelList.length == 0) {
				throwNotFoundException('Channel not found.');
			} else {
				return channelList;
			}
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async addChannel(data: ChannelDto) {
		try {
			const newChannel = await this.channelModel.create({ ...data });
			return {
				name: newChannel.name,
				_id: newChannel._id,
			};
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
