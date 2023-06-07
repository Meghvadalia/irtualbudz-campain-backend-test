export interface IInventory {
	productId: string;
	clientId: string;
	productDescription:string;
	productName:string;
	priceInMinorUnits:number;
	sku:string;
	nutrients:string;
	productPictureURL:string;
	category:string;
	type:string;
	brand:string;
	isMixAndMatch:boolean;
	isStackable:boolean;
	productUnitOfMeasure:string;
	productUnitOfMeasureToGramsMultiplier:string;
	productWeight:number;
	weightTierInformation:WeightTierInformation;
	cannabinoidInformation:CannabinoidInformation;
	quantity: number;
	inventoryUnitOfMeasure: string;
	inventoryUnitOfMeasureToGramsMultiplier: number;
	locationId: number;
	locationName: string;
	currencyCode: string;
	expirationDate: string;
	speciesName: string;
	productUpdatedAt: string;
}
export interface CannabinoidInformation {
	name:string;
	lowerRange:number | null;
	upperRange:number | null;
	unitOfMeasure:string;
	unitOfMeasureToGramsMultiplier:string | null;
}

export interface WeightTierInformation {
	name: string;
	gramAmount: string;
	pricePerUnitInMinorUnits: number | null;
}

// export enum OrderType {
// 	inStore = 'in-store',
// 	Delivery = 'Delivery',
// 	pickUp = 'Pickup',
// }

// export enum PaymentType {
// 	cash = 'cash',
// 	debit = 'debit',
// 	loyaltyPoints = 'loyalty points',
// 	giftCard = 'gift card',
// }

// export enum OrderStatus {
// 	Pending = 'Pending',
// 	Cancelled = 'Cancelled',
// 	sold = 'Sold',
// }

export enum Category {
	PackedBud = 'PackedBud',
	PackedShake = 'PackedShake',
	BulkBud = 'BulkBud',
	BulkShake = 'BulkShake',
	Concentrate = 'Concentrate',
	Extract = 'Extract',
	Accessory = 'Accessory',
	Infused = 'Infused',
	Edible = 'Edible',
	NonEdible = 'NonEdible',
	Suppository = 'Suppository',
	Patch = 'Patch',
	Topical = 'Topical',
	Tincture = 'Tincture',
	Capsule = 'Capsule',
	Seed = 'Seed',
	Clone = 'Clone',
	Joint = 'Joint',
	PackedBudNonStandard = 'PackedBudNonStandard',
	PackedShakeNonStandard = 'PackedShakeNonStandard'
}

// export enum UnitOfWeight {
// 	Each = 'Each',
// 	Gram = 'Gram',
// }
