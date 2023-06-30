export interface IInventory {
	companyId: string;
	posId: string;
	productId: string;
	posProductId: string;
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
