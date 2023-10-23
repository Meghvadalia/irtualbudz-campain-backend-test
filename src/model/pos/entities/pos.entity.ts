import { ObjectType } from '@nestjs/graphql';

import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IPOS } from '../interface/pos.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({
	collection: DATABASE_COLLECTION.POS,
	timestamps: true,
})
@ObjectType()
export class POS extends Model<IPOS> {
	@Prop({ trim: true, required: true, unique: true })
		name: string;

	@Prop({ trim: true, required: true })
		liveUrl: string;

	@Prop({ trim: true })
		stagingUrl: string;

	@Prop({ trim: true })
		documentationUrl: string;

	@Prop({ default: false })
		isDeleted: boolean;

	@Prop({ default: true })
		isActive: boolean;
}

export const POSSchema = SchemaFactory.createForClass(POS);
