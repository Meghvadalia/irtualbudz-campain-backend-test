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
	name: String;
	@Prop({ trim: true, required: true })
	liveUrl: String;
	@Prop({ trim: true, required: true })
	stagingUrl: String;
	@Prop({ trim: true })
	documentationUrl: String;
	

	@Prop({ default: Date.now })
	updatedAt: Date;

	@Prop({ default: false })
	isDeleted: boolean;

	@Prop({ default: true })
	isActive: boolean;
}

export const POSSchema = SchemaFactory.createForClass(POS);
