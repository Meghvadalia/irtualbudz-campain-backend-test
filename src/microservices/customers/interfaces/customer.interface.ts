export interface ICustomer {
	posCustomerId: string;
	storeId?: string;
	companyId: string;
	POSId: string;
	type: CustomerType;
	name: string;
	state: string;
	birthDate: Date;
	isLoyal: boolean;
	loyaltyPoints: number;
	phone: string;
	email: string;
	streetAddress1: string;
	streetAddress2: string;
	city: string;
	zip: string;
	country: string;
}

export enum CustomerType {
	medCustomer = 'medCustomer',
	recCustomer = 'recCustomer',
}
