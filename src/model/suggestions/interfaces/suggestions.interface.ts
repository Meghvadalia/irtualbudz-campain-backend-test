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
	BIG_SPENDER_SLOW_MOVING_ITEMS = 'Big Spender Slow Moving Items',
	GEN_Z_SLOW_MOVING_ITEMS = 'Generation Z Slow Moving Items',
	GEN_X_SLOW_MOVING_ITEMS = 'Generation X Slow Moving Items',
	FREQUENT_FLYER_SLOW_MOVING_ITEMS = 'Frequent Flyer Slow Moving Items',
	SLOW_MOVING_ITEMS_NEW = 'slow moving items - new',
	TOP_5_MARGINS_UNIQUE_CATEGORY = 'Top-5 margins with unique category',
	TOP_5_MARGINS_UNIQUE_BRAND = 'Top-5 margins with unique brand',
	TOP_5_MARGINS = 'Top-5 margins',
	SLOW_MOVING_ITEMS_WITH_UNIQUE_BRAND_NEW = 'Slow moving items with unique brand - new',
	SLOW_MOVING_ITEMS_WITH_UNIQUE_CATEGORY_NEW = 'Slow moving items with unique category - new',
	EXPIRING_PRODUCTS_UNIQUE_BRAND = 'Expiring Products with unique brand',
	EXPIRING_PRODUCTS_UNIQUE_CATEGORY = 'Expiring Products with unique category',
	SLOW_MOVING_ITEMS_UNIQUE_BRAND = 'Slow moving items with unique brand',
	SLOW_MOVING_ITEMS_UNIQUE_CATEGORY = 'Slow moving items with unique category',
	EXCESS_INVENTORY_UNIQUE_BRAND = 'Excess Inventory with unique brand',
	EXCESS_INVENTORY_UNIQUE_CATEGORY = 'Excess Inventory with unique category',
	NEW_INVENTORY_ITEMS_UNIQUE_BRAND = 'New Inventory with unique brand',
	New_INVENTORY_ITEMS_UNIQUE_CATEGORY = 'New Inventory with unique category',
	HIGHEST_PROFITABLE_ITEMS_UNIQUE_BRAND = 'Highest profitable Items with unique brand',
	HIGHEST_PROFITABLE_ITEMS_UNIQUE_CATEGORY = 'Highest profitable Items with unique category',
}
