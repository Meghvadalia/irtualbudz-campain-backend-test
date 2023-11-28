import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ITemplate } from '../interfaces/template.interface';

@Schema({ collection: DATABASE_COLLECTION.TEMPLATE, timestamps: true })
export class Template extends Model<ITemplate> {
	@Prop({ type: String })
		template: string;

	// @Prop({ type: Boolean, default: true })
	// isActive: boolean;

	// @Prop({ type: Boolean, default: false })
	// isDeleted: boolean;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.RAW_TEMPLATE })
		rawTemplateId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.CAMPAIGN })
		campaignId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.USER })
		userId: Types.ObjectId;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
