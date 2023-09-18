import { ObjectType } from '@nestjs/graphql';

import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { IGOALS } from '../interface/goals.interface';

@Schema({
	collection: DATABASE_COLLECTION.GOALS,
	timestamps: true,
})
@ObjectType()
export class Goals extends Model<IGOALS> {
	@Prop({ trim: true, required: true, unique: true })
	name: String;

	@Prop({ default: false })
	isDeleted: boolean;

	@Prop({ default: true })
	isActive: boolean;

	@Prop({
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.GRAPH,
		default: null,
	})
	graphId: Types.ObjectId;

	@Prop({ default: false })
	isTrackable: boolean;
}

export const GoalsSchema = SchemaFactory.createForClass(Goals);
