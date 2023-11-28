import { IAction } from 'src/model/actions/interface/action.interface';

export enum ACTIONS {
	INCREASE_MARGINS = 'Increase Margins',
	REDUCE_INVENTORY = 'Reduce Inventory',
	MARKET_SPECIFIC_BRAND = 'Market Specific Brand',
	INCREASE_TRANSACTIONS = 'Increase Transactions',
	POP_UPS = 'Pop-Ups',
	SALE_DAY = 'Sale Day',
	CROSS_PROMOTION = 'Cross Promotion',
	INCREASE_SOCIAL_MEDIA_TRAFFIC = 'Increase Social-Media Traffic',
	BUNDLES = 'Bundles',
	PURCHASE_INCENTIVES = 'Purchase Incentives',
	MARKET_SPECIFIC_CATEGORY = 'Market specific category',
}

export const actionsList: IAction[] = [
	{
		name: ACTIONS.INCREASE_MARGINS,
		isActive: true,
		isDeleted: false,
		isTrackable: true,
	},
	{
		name: ACTIONS.REDUCE_INVENTORY,
		isActive: true,
		isDeleted: false,
		isTrackable: true,
	},
	{
		name: ACTIONS.MARKET_SPECIFIC_BRAND,
		isActive: true,
		isDeleted: false,
		isTrackable: true,
	},
	{
		name: ACTIONS.INCREASE_TRANSACTIONS,
		isActive: true,
		isDeleted: false,
		isTrackable: true,
	},
	{
		name: ACTIONS.POP_UPS,
		isActive: true,
		isDeleted: false,
		isTrackable: false,
	},
	{
		name: ACTIONS.SALE_DAY,
		isActive: true,
		isDeleted: false,
		isTrackable: false,
	},
	{
		name: ACTIONS.CROSS_PROMOTION,
		isActive: true,
		isDeleted: false,
		isTrackable: false,
	},
	{
		name: ACTIONS.INCREASE_SOCIAL_MEDIA_TRAFFIC,
		isActive: false,
		isDeleted: false,
		isTrackable: false,
	},
	{
		name: ACTIONS.BUNDLES,
		isActive: true,
		isDeleted: false,
		isTrackable: false,
	},
	{
		name: ACTIONS.PURCHASE_INCENTIVES,
		isActive: true,
		isDeleted: false,
		isTrackable: false,
	},
];
