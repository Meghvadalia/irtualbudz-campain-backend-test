export interface BaseInterface {
	_id?: string;
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
