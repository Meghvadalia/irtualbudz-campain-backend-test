export interface ISuggestions {
	_id?: string;
	name: Suggestions | string;
	dateOffset?: number;
	collectionName?: string;
	condition?: any;
	display: boolean;
	isActive: boolean;
	isDeleted: boolean;
}

export enum Suggestions {
	CATEGORY_SATURATION = 'Category Saturation',
	EXPIRING_PRODUCTS = 'Expiring Products',
	SLOW_MOVING_ITEMS = 'Slow Moving Items',
	BRANDS = 'Brands',
	CATEGORY = 'Category',
	CONTESTS = 'Contests',
	REFER_A_FRIEND = 'Refer a friend',
	EXCESS_INVENTORY = 'Excess Inventory',
	NEW_INVENTORY_ITEM = 'New Inventory Item',
	HIGHEST_PROFITABLE_ITEMS = 'Top-5 highest profitable items',
	CO_OP_WITH_PARTNER_BRAND = 'Co-Op with partner brand',
	HAPPY_HOUR_SPECIALS = 'Happy Hour Specials',
	RECEIPT_FOR_DISCOUNTS = 'Bring in receipt for discounts',
	BUNDLE_ITEMS = 'Bundle Items',
	BIG_SPENDER_TOP_5_MARGINS = 'Big Spender top 5 margins',
	GEN_Z_TOP_5_MARGINS = 'Generation Z top 5 margins',
	GEN_X_TOP_5_MARGINS = 'Generation X top 5 margins',
	FREQUENT_FLYER_TOP_5_MARGINS = 'Frequent Flyer top 5 margins',
}
