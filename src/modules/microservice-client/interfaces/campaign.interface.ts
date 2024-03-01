import { Types } from 'mongoose';
import { BaseInterface } from 'src/common/interface';

export interface ICampaign extends BaseInterface {
	campaignName: string;
	goals: string;
	// campaignType: string;
	audienceId: Types.ObjectId[];
	storeId: Types.ObjectId;
	actions: string;
	startDateWithTime: Date;
	endDateWithTime: Date;
	notes: string;
	files: string[];
	channels: Types.ObjectId[];
	sortItem: SORT_ITEM[];
	// sortBy: sortBy;
	productDiscount: number[];
	productDiscountNote: string[];
	selectedSuggestion: string[];
	addCartValue: string;
	schedulesDays: string[];
	discount: string;
	campaignStatus: CAMPAIGN_STATUS;
	listId?: string;
}

export enum SORT_KEYS {
	AllSellable = 'sellable',
	Brand = 'brand',
	Category = 'category',
}

export enum CAMPAIGN_STATUS {
	NOT_STARTED = 'Not Started',
	IN_PROGRESS = 'In Progress',
	CLOSED = 'Closed',
}

export interface SORT_ITEM {
	suggestionId: Types.ObjectId;
	sortBy: SORT_BY[];
}

export interface SORT_BY {
	key: SORT_KEYS;
	value: Types.ObjectId[] | string[];
}
