import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AudienceType, DATABASE_COLLECTION, GenerationGroup } from 'src/common/constants';
import { IAudienceDetails } from '../interfaces/audienceDetails.interface';

@Schema({ collection: DATABASE_COLLECTION.AUDIENCE_DETAIL, timestamps: true })
export class AudienceDetail extends Model<IAudienceDetails> {

	@Prop({ required: true })
	name: GenerationGroup;

	@Prop()
	audienceDescription: String;

	@Prop({ default: true })
	isActive: Boolean;

	@Prop({ default: false })
	isDeleted: Boolean;

	@Prop({ enum: AudienceType })
	type: AudienceType;
}

export const AudienceDetailSchema = SchemaFactory.createForClass(AudienceDetail);
