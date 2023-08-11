export interface IOrder {
	posOrderId: string;
	customerId: string;
	currentPoints: number;
	name: string;
	orderStatus: string;
	orderType: string;
	totals: Totals;
	itemsInCart: Array<string>;
	customerType: CustomerType;
	storeId: string;
	voided: boolean;
	fullName: string;
	staffId: string;
	payments: Payments;
	[property: string]: any;
	posCreatedAt: Date;
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
	finalTotal: number;
	subTotal: number;
	totalDiscounts: number;
	totalFees: number;
	totalTaxes: number;
}

export interface ItemDiscounts {
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

// export enum UnitOfWeight {
// 	Each = 'Each',
// 	Gram = 'Gram',
// }

export interface LocationData {
	_id: string;
	location: {
		locationId: string;
		importId: string;
	};
}
