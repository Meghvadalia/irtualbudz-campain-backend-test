import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ICampaignType } from '../interface/campaignTypes.interface';

@Schema({ collection: DATABASE_COLLECTION.CAMPAIGN_TYPES, timestamps: true })
export class CampaignTypes extends Model<ICampaignType> {
	@Prop({ required: true, trim: true })
		name: string;

	@Prop({ default: true })
		isActive: boolean;

	@Prop({ default: false })
		isDeleted: boolean;
}

export const CampaignTypesSchema = SchemaFactory.createForClass(CampaignTypes);
