import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Model } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { ICampaignAsset, ICampaignAssetFiles } from '../interface/campaignAsset.interface';

@Schema({ timestamps: true })
export class AssetFiles extends Model<ICampaignAssetFiles> {
	@Prop({ required: true })
		filePath: string;

	@Prop({ default: true })
		isActive: boolean;
}

export const AssetFilesSchema = SchemaFactory.createForClass(AssetFiles);

@Schema({ collection: DATABASE_COLLECTION.CAMPAIGN_ASSETS, timestamps: true })
export class CampaignAsset extends Model<ICampaignAsset> {
	@Prop({ required: true, ref: DATABASE_COLLECTION.CHANNELS })
		channelId: mongoose.Schema.Types.ObjectId;

	@Prop({ required: true, ref: DATABASE_COLLECTION.CAMPAIGN })
		campaignId: mongoose.Schema.Types.ObjectId;

	@Prop({ type: [AssetFilesSchema], default: [] })
		files: ICampaignAssetFiles[];
}

export const CampaignAssetsSchema = SchemaFactory.createForClass(CampaignAsset);
