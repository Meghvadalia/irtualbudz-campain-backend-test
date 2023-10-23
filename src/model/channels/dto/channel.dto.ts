import { IsNotEmpty } from 'class-validator';

export class ChannelDto {
	@IsNotEmpty()
		name: string;
}
