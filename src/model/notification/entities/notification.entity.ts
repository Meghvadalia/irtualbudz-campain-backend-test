import { ObjectType } from '@nestjs/graphql';

import mongoose, { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { INOTIFICATION } from '../interface/notification.interface';

@Schema({
	collection: DATABASE_COLLECTION.NOTIFICATION,
	timestamps: true,
})
@ObjectType()
export class Notification extends Model<INOTIFICATION> {
	@Prop({ trim: true, required: true })
		title: string;

	@Prop({ default: false })
		isDeleted: boolean;

	@Prop({ default: true })
		isRead: boolean;

	@Prop({ trim: true, required: true })
		message: string;

	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: DATABASE_COLLECTION.USER,
	})
		userId: Types.ObjectId;

	@Prop({ required: true, ref: DATABASE_COLLECTION.STORES, type: mongoose.Schema.Types.ObjectId })
		storeId: Types.ObjectId;

	@Prop({ type: Array })
		notificationData: object;

	@Prop({})
		notificationType: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
