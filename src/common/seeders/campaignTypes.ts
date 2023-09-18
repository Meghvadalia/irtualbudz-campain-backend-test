import { ICampaignType } from 'src/model/campaignTypes/interface/campaignTypes.interface';

export const CAMPAIGN_LIST = {
	LIMITED_TIME_SALES: 'Limited Time Sales',
	IN_STORE_EVENTS: 'In-Store Events',
	COMMUNITY_OUTREACH: 'Community Outreach',
	LIMITED_QUANTITY_SALE: 'Limited Quantity Sale',
	DAILY_SPECIALS: 'Daily Specials',
};

export const CAMPAIGN_TYPES: ICampaignType[] = [
	{
		name: CAMPAIGN_LIST.LIMITED_TIME_SALES,
	},
	{
		name: CAMPAIGN_LIST.IN_STORE_EVENTS,
	},
	{
		name: CAMPAIGN_LIST.COMMUNITY_OUTREACH,
	},
	{
		name: CAMPAIGN_LIST.LIMITED_QUANTITY_SALE,
	},
	{
		name: CAMPAIGN_LIST.LIMITED_TIME_SALES,
	},
	{
		name: CAMPAIGN_LIST.DAILY_SPECIALS,
	},
];
