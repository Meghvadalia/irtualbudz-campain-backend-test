export interface ItemsCart {
	_id: string;
	posCartId:string;
	locationId:string;
	sku: string;
	category: Category;
	title1: string;
	title2: string;
	productName: string;
	strainName: string;
	unitOfWeight: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	unitCost: number;
	totalCost: number;
	itemDiscounts: ItemDiscounts;
	tax: Tax;
}

export interface Tax {
	_id: string;
	name: string;
	percentage: number;
	calculateBeforeDiscounts: string;
	supplierSpecificTax: boolean;
	excludeCustomerGroups: string[];
	enableCostMarkup: boolean;
	markupPercentage: number;
	thisTaxInPennies: number;
	appliesTo: AppliesTo;
}


export interface ItemDiscounts {
	_id: string;
	name?: string;
	type?: string;
	discountAmount?: number;
	discountType?: string;
	discountId?: string;
	ItemDiscounts?: string;
	dollarsOff?: number;
	penniesOff?: number;
	percentOff?: number;
	discounterName?: string;
	discounterId?: string;
	isCartDiscount?: string;
	couponCode?: string;
	quantity?: number;
}


export enum AppliesTo {
	all = 'all',
	nonCannabis = 'nonCannabis',
	rec = 'rec',
	med = 'med',
	both = 'both',
	delivery = 'delivery',
}

export enum Category {
	BulkBud = 'BulkBud',
	PackedBud = 'PackedBud',
	Edible = 'Edible',
	NonEdible = 'NonEdible',
	Concentrate = 'Concentrate',
	Accessory = 'Accessory',
}