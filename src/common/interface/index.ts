export interface BaseInterface {
	_id?: string;
	id?: string;
}
export interface IAddress {
	streetAddress1: string;
	streetAddress2: string;
	city: string;
	state: string;
	county: string;
	zip: string;
	country: string;
}

export interface IhoursOfOperation {
	day: string;
	openTime: string;
	closeTime: string;
}

export interface ILocation {
	latitude?: number;
	longitude?: number;
	locationId: string;
	importId?: string;
	[property: string]: any;
}

export interface IFlowhubHeaderInterface {
	clientId?: string;
	key: string;
}

export interface IStoreResponseFlowHub {
	locationId: string;
	locationName: string;
	importId: string;
	website: string;
	hoursOfOperation: IhoursOfOperation[];
	clientId: number;
	clientName: string;
	locationLogoURL: string;
	timeZone: string;
	address: IAddress;
	phoneNumber: string;
	email: string;
	licenseType: string[];
	[property: string]: any;
}

export interface ICartItemFlowhub {
	category: string;
	sku: string;
	title1: string;
	title2: string;
	brand: string;
	strainName?: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	unitOfWeight: string;
	unitCost: number;
	totalCost: number;
	itemDiscounts: any[]; // Replace with the appropriate type
	tax: ITaxFlowhub[];
	id: string;
	// ... other properties
}

export interface ITaxFlowhub {
	_id: string;
	name: string;
	percentage: number;
	appliesTo: string;
	supplierSpecificTax: boolean;
	excludeCustomerGroups: any[]; // Replace with the appropriate type
	thisTaxInPennies: number;
	// ... other properties
}

export interface IPaymentFlowHub {
	_id: string;
	amount: number;
	cardId?: string;
	paymentType: string;
	debitProvider?: string;
	loyaltyPoints?: number;
	balanceAfterPayment?: string;
	// ... other properties
}

export interface ITotalsFlowhub {
	finalTotal: number;
	subTotal: number;
	totalDiscounts: number;
	totalFees: number;
	totalTaxes: number;
	// ... other properties
}
export interface IOrderFlowHubInterface {
	_id?: string;
	id?: string;
	clientId: string;
	createdAt: string;
	customerId: string;
	currentPoints: number;
	customerType: string;
	name: string;
	locationId: string;
	locationName: string;
	itemsInCart: ICartItemFlowhub[];
	voided: boolean;
	fullName: string;
	orderType: string;
	payments: IPaymentFlowHub[];
	totals: ITotalsFlowhub;
	completedOn: string;
	orderStatus: string;
	budtender: string;
	// ... other properties
}

interface ITransactionItemDiscountDutchiee {
	discountId: number;
	discountName: string;
	discountReason: string;
	amount: number;
	transactionItemId: number;
}

interface ITransactionItemTaxDutiche {
	rateName: string;
	rate: number;
	amount: number;
	transactionItemId: number;
}

interface ITransactionItemDutiche {
	transactionId: number;
	productId: number;
	totalPrice: number;
	quantity: number;
	unitPrice: number;
	unitCost: number;
	packageId: string;
	sourcePackageId: string;
	totalDiscount: number;
	unitId: number;
	unitWeight: number | null;
	unitWeightUnit: string;
	flowerEquivalent: number | null;
	flowerEquivalentUnit: string;
	discounts: ITransactionItemDiscountDutchiee[];
	taxes: ITransactionItemTaxDutiche[];
	returnDate: string | null;
	isReturned: boolean;
	returnedByTransactionId: number | null;
	returnReason: string | null;
	batchName: string;
	transactionItemId: number;
	vendor: string;
	isCoupon: boolean;
}

interface ITaxSummaryDutchie {
	rateName: string;
	amount: number;
}

export interface IDutchieOrderInterface {
	transactionId: number;
	customerId: number;
	employeeId: number;
	transactionDate: string;
	voidDate: string | null;
	isVoid: boolean;
	subtotal: number;
	totalDiscount: number;
	totalBeforeTax: number;
	tax: number;
	tipAmount: number;
	total: number;
	paid: number;
	changeDue: number;
	totalItems: number;
	terminalName: string;
	checkInDate: string;
	invoiceNumber: string | null;
	isTaxInclusive: boolean;
	transactionType: string;
	loyaltyEarned: number;
	loyaltySpent: number;
	items: ITransactionItemDutiche[];
	discounts: ITransactionItemDiscountDutchiee[];
	lastModifiedDateUTC: string;
	cashPaid: number;
	debitPaid: number;
	electronicPaid: number | null;
	electronicPaymentMethod: string | null;
	checkPaid: number;
	creditPaid: number;
	giftPaid: number;
	mmapPaid: number;
	prePaymentAmount: number;
	revenueFeesAndDonations: number | null;
	nonRevenueFeesAndDonations: number;
	feesAndDonations: any[]; // Replace with appropriate type
	taxSummary: ITaxSummaryDutchie[];
	returnOnTransactionId: number | null;
	adjustmentForTransactionId: number | null;
	orderType: string;
	wasPreOrdered: boolean;
	orderSource: string;
	orderMethod: string | null;
	invoiceName: string | null;
	isReturn: boolean;
	authCode: string | null;
	customerTypeId: number;
	isMedical: boolean;
	orderIds: number[];
	totalCredit: number;
	completedByUser: string;
	transactionDateLocalTime: string;
	estTimeArrivalLocal: string | null;
	estDeliveryDateLocal: string;
}

export interface IReplacements {
	key: string;
	value: any;
}
