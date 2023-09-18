export interface IInventory {
	companyId: string;
	posId: string;
	productId: string;
	posProductId: string;
	quantity: number;
	storeId: string;
	sku: string;
	locationName: string;
	expirationDate: Date;
	productUpdatedAt: Date;
	costInMinorUnits: number;
	priceInMinorUnits: number;
	forSale: boolean;
	extraDetails: {
		currencyCode: string;
		inventoryUnitOfMeasure: string;
		inventoryUnitOfMeasureToGramsMultiplier: number;
	};
}
