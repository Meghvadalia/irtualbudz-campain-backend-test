import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ICampaign, CAMPAIGN_STATUS, sortBy } from '../interfaces/campaign.interface';

@Schema({ collection: DATABASE_COLLECTION.CAMPAIGN, timestamps: true })
export class Campaign extends Model<ICampaign> {
	@Prop({ required: true, trim: true })
	campaignName: string;

	@Prop({ ref: DATABASE_COLLECTION.GOALS, required: true, type: mongoose.Schema.Types.ObjectId })
	goals: Types.ObjectId;

	@Prop({ required: true, ref: DATABASE_COLLECTION.CAMPAIGN_TYPES, type: mongoose.Schema.Types.ObjectId })
	campaignType: Types.ObjectId;

	@Prop({ required: true, ref: DATABASE_COLLECTION.AUDIENCE_DETAIL, type: mongoose.Schema.Types.ObjectId })
	audienceId: Types.ObjectId;

	@Prop({ required: true, ref: DATABASE_COLLECTION.STORES, type: mongoose.Schema.Types.ObjectId })
	storeId: Types.ObjectId;

	@Prop({ required: true, ref: DATABASE_COLLECTION.ACTIONS, type: mongoose.Schema.Types.ObjectId })
	actions: Types.ObjectId;

	@Prop()
	notes: string;

	@Prop()
	files: string[];

	@Prop({ ref: DATABASE_COLLECTION.CHANNELS, type: [mongoose.Schema.Types.ObjectId] })
	channels: Types.ObjectId[];

	@Prop({ required: true })
	startDateWithTime: Date;

	@Prop({ required: true })
	endDateWithTime: Date;

	@Prop({ enum: sortBy })
	sortBy: sortBy;

	@Prop({ ref: DATABASE_COLLECTION.PRODUCT })
	sortItem: Types.ObjectId[];

	@Prop()
	productDiscount: number[];

	@Prop()
	productDiscountNote: string[];

	@Prop({ ref: DATABASE_COLLECTION.SUGGESTIONS })
	selectedSuggestion: Types.ObjectId[];

	@Prop()
	addCartValue: string;

	@Prop()
	schedulesDays: string[];

	@Prop()
	discount: string;
	
	@Prop()
	isDeleted:Boolean

	@Prop({ enum: CAMPAIGN_STATUS, default: CAMPAIGN_STATUS.NOT_STARTED })
	campaignStatus: CAMPAIGN_STATUS;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
