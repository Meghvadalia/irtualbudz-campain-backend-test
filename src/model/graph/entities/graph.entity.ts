import { ObjectType } from '@nestjs/graphql';

import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IGraph, iAxes } from '../interface/graph.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({
	collection: DATABASE_COLLECTION.GRAPH,
	timestamps: true,
})
@ObjectType()
export class Graph extends Model<IGraph> {
	@Prop({ trim: true, required: true, unique: true })
		name: string;

	@Prop({ trim: true, required: true })
		condition: Array<IGraph>;

	@Prop({ trim: true })
		axes: Array<iAxes>;

	@Prop({ default: false })
		isTrackable: boolean;
}

export const GraphSchema = SchemaFactory.createForClass(Graph);
GraphSchema.index({ name: 1 });