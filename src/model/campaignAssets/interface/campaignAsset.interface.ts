import mongoose from 'mongoose';

export interface ICampaignAsset {
	_id: mongoose.Schema.Types.ObjectId;
	channelId: mongoose.Schema.Types.ObjectId;
	campaignId: mongoose.Schema.Types.ObjectId;
	files: ICampaignAssetFiles[];
}

export interface ICampaignAssetFiles {
	_id?: mongoose.Schema.Types.ObjectId;
	isActive: boolean;
	filePath: string;
}
