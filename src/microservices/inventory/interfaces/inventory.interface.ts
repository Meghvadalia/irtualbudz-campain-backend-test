export interface IInventory {
	companyId: string;
	posId: string;
	posProductId: string;
	productId: string;
	quantity: number;
	locationId: string;
	locationName: string;
	expirationDate: string;
	productUpdatedAt: string;
	extraDetails: {
		currencyCode: string;
		inventoryUnitOfMeasure: string;
		inventoryUnitOfMeasureToGramsMultiplier: number;
	};
}
