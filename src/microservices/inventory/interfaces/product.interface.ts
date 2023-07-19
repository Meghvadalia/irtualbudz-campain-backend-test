export interface IProduct {
	posId: string;
	companyId: string;
	productName: string;
	posProductId: string;
	productDescription: string;
	sku: string;
	productPictureURL: string;
	purchaseCategory: string;
	category: string;
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
