import { Types } from 'mongoose';

export interface ICampaign {
	campaignName: string;
	goals: string;
	campaignType: string;
	audienceId: Types.ObjectId;
	storeId: Types.ObjectId;
	actions: string;
	startDateWithTime: Date;
	endDateWithTime: Date;
	notes: string;
	files: string[];
	channels: Types.ObjectId[];
	sortItem: string[];
	sortBy: sortBy;
	productDiscount: number[];
	productDiscountNote: string[];
	selectedSuggestion: string[];
	addCartValue: string;
	schedulesDays: string[];
	discount: string;
	campaignStatus: CAMPAIGN_STATUS;
}

export enum sortBy {
	AllSellable = 'sellable',
	Brand = 'brand',
	Category = 'category',
}

export enum CAMPAIGN_STATUS {
	NOT_STARTED = 'Not Started',
	IN_PROGRESS = 'In Progress',
	CLOSED = 'Closed',
}
