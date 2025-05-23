import { CUSTOMER_TYPE } from '../constant/order.constant';

export interface IOrder {
	posOrderId: string;
	customerId: string;
	currentPoints: number;
	name: string;
	orderStatus: string;
	orderType: string;
	totals: Totals;
	itemsInCart: Array<string>;
	customerType: CUSTOMER_TYPE;
	storeId: string;
	voided: boolean;
	fullName: string;
	staffId: string;
	payments: Payments;
	[property: string]: any;
	posCreatedAt: Date;
}

export interface Totals {
	finalTotal: number;
	subTotal: number;
	totalDiscounts: number;
	totalFees: number;
	totalTaxes: number;
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


export interface LocationData {
	_id: string;
	location: {
		locationId: string;
		importId: string;
	};
}
