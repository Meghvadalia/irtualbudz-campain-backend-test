export interface IProduct {
	posId: string;
	companyId: string;
	productName: string;
	posProductId: string;
	productDescription: string;
	sku: string;
	productPictureURL: string;
	purchaseCategory: string;
	category: Category;
	type: string;
	brand: string;
	productWeight: number;
	speciesName: string;
	extraDetails: {
		nutrients: string;
		isMixAndMatch: boolean;
		isStackable: boolean;
		productUnitOfMeasure: string;
		productUnitOfMeasureToGramsMultiplier: string;
		cannabinoidInformation: CannabinoidInformation;
		weightTierInformation: WeightTierInformation;
	};
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
