export interface IProduct {
	posId: string;
	companyId: string;
	clientId: number;
	productName: string;
	productDescription: string;
	priceInMinorUnits: number;
	sku: string;
	nutrients: string;
	productPictureURL: string;
	purchaseCategory: string;
	category: Category;
	type: string;
	brand: string;
	isMixAndMatch: boolean;
	isStackable: boolean;
	productUnitOfMeasure: string;
	productUnitOfMeasureToGramsMultiplier: string;
	productWeight: number;
	weightTierInformation: WeightTierInformation;
	cannabinoidInformation: CannabinoidInformation;
	speciesName: string;
}

export interface CannabinoidInformation {
	name: string;
	lowerRange: number | null;
	upperRange: number | null;
	unitOfMeasure: string;
	unitOfMeasureToGramsMultiplier: string | null;
}

export interface WeightTierInformation {
	name: string;
	gramAmount: string;
	pricePerUnitInMinorUnits: number | null;
}

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
	PackedShakeNonStandard = 'PackedShakeNonStandard',
}
