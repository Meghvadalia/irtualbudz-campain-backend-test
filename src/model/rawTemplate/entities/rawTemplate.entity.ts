import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { IRawTemplate } from '../interfaces/rawTemplate.interface';

@Schema({ collection: DATABASE_COLLECTION.RAW_TEMPLATE, timestamps: true })
export class RawTemplate extends Model<IRawTemplate> {
	@Prop({ type: String, required: true })
		subject: string;

	@Prop({ type: String })
		content: string;

	@Prop({ type: Number })
		itemCount: number;

	@Prop({ type: Boolean, default: true })
		isActive: boolean;

	@Prop({ type: Boolean, default: false })
		isDeleted: boolean;

	@Prop({ type: [String] })
		replacements: string[];

	@Prop({ type: String, required: true })
		image: string;
}

export const RawTemplateSchema = SchemaFactory.createForClass(RawTemplate);
