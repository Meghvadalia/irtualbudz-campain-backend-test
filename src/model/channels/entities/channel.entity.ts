import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ChannelTypes, IChannel } from '../interface/channel.interface';

@Schema({ collection: DATABASE_COLLECTION.CHANNELS, timestamps: true })
export class Channel extends Model<IChannel> {
	@Prop({ required: true, trim: true, unique: true })
	name: ChannelTypes;

	@Prop({ default: true })
	isActive: boolean;

	@Prop({ default: false })
	isDeleted: boolean;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
