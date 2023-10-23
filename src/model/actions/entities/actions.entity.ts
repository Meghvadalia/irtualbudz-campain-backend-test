import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { IAction } from '../interface/action.interface';
import { ACTIONS } from 'src/common/seeders/actions';

@Schema({ collection: DATABASE_COLLECTION.ACTIONS, timestamps: true })
export class Action extends Model<IAction> {
	@Prop({ required: true, trim: true })
		name: ACTIONS;

	@Prop({ default: true })
		isActive: boolean;

	@Prop({ default: false })
		isDeleted: boolean;

	@Prop({
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.GRAPH,
		default: null,
	})
		graphId: Types.ObjectId;

	@Prop({ default: false })
		isTrackable: boolean;
}

export const ActionSchema = SchemaFactory.createForClass(Action);
