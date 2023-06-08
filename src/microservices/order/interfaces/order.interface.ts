export interface IOrder {
	// id: string;
	clientId: string;
	customerId: string;
	currentPoints: number;
	Name: string;
	orderStatus: string;
	orderType: string;
	orderId: string;
	totals: Totals;
	itemsInCart: ItemsInCart;
	customerType: CustomerType;
	locationId: string;
	voided: boolean;
	fullName: string;
	budtender: string;
	payments: Payments;
	[property: string]: any;
}

export interface ItemsInCart {
	_id: string;
	// sku: string;
	// category: Category;
	// title1: string;
	// title2: string;
	// productName: string;
	// strainName: string;
	// unitOfWeight: string;
	// quantity: number;
	// unitPrice: number;
	// totalPrice: number;
	// unitCost: number;
	// totalCost: number;
	// itemDiscounts: ItemDiscounts;
	// tax: Tax;
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

export interface Totals {
	FinalTotal: number;
	SubTotal: number;
	TotalDiscounts: number;
	TotalFees: number;
	TotalTaxes: number;
}

export interface ItemDiscounts {
	_id: string;
	name: string;
	type: string;
	discountAmount: number;
	discountType: string;
	discountId: string;
	ItemDiscounts: string;
	dollarsOff: number;
	penniesOff: number;
	percentOff: number;
	discounterName: number;
	discounterId: string;
	isCartDiscount: string;
	couponCode: string;
	quantity: number;
}

export interface Payments {
	_id: string;
	paymentType: string;
	amount: number;
	cardId: string;
	loyaltyPoints: number;
	debitProvider: string;
	balanceAfterPayment: number;
}

export enum AppliesTo {
	all = 'all',
	nonCannabis = 'nonCannabis',
	rec = 'rec',
	med = 'med',
	both = 'both',
	delivery = 'delivery',
}

export enum CustomerType {
	recCustomer = 'recCustomer',
	medCustomer = 'medCustomer',
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
	BulkBud = 'BulkBud',
	PackedBud = 'PackedBud',
	Edible = 'Edible',
	NonEdible = 'NonEdible',
	Concentrate = 'Concentrate',
	Accessory = 'Accessory',
}

// export enum UnitOfWeight {
// 	Each = 'Each',
// 	Gram = 'Gram',
// }

export interface ItemsCart {
	_id: string;
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