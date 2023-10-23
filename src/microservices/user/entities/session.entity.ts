import { ObjectType } from '@nestjs/graphql';
import mongoose, { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { USER_TYPE } from '../constants/user.constant';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ISession } from '../interfaces/session.interface';

@Schema({
	collection: DATABASE_COLLECTION.SESSION,
	timestamps: true,
})
@ObjectType()
export class Session extends Model<ISession> {
	@Prop({
		required: true,
		type: mongoose.Schema.Types.ObjectId,
		ref: DATABASE_COLLECTION.USER,
	})
		userId: string;

	@Prop({ required: true })
		type: USER_TYPE;

	@Prop({ type: Boolean, default: true })
		status: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
