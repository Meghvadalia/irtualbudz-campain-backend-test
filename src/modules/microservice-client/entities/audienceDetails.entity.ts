import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AudienceType, DATABASE_COLLECTION, GenerationGroup } from 'src/common/constants';
import { IAudienceDetails } from '../interfaces/audienceDetails.interface';

@Schema({ collection: DATABASE_COLLECTION.AUDIENCE_DETAIL, timestamps: true })
export class AudienceDetail extends Model<IAudienceDetails> {
	@Prop({ required: true })
	name: GenerationGroup;

	@Prop()
	audienceDescription: string;

	@Prop({ default: true })
	isActive: boolean;

	@Prop({ default: false })
	isDeleted: boolean;

	@Prop({ enum: AudienceType })
	type: AudienceType;

	@Prop({ required: true })
	displayIndex: Number;
}

export const AudienceDetailSchema = SchemaFactory.createForClass(AudienceDetail);
