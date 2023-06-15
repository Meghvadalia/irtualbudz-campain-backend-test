export interface IInventory {
	companyId: string;
	posId: string;
	posProductId: string;
	productId: string;
	clientId: string;
	quantity: number;
	inventoryUnitOfMeasure: string;
	inventoryUnitOfMeasureToGramsMultiplier: number;
	locationId: number;
	locationName: string;
	currencyCode: string;
	expirationDate: string;
	productUpdatedAt: string;
}
