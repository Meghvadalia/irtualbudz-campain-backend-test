import { IAddress, ILocation, IhoursOfOperation } from 'src/common/interface';

export interface IStore {
	location: ILocation;
	companyId: string;
	hoursOfOperation: IhoursOfOperation[];
	timeZone: string;
	address: IAddress;
	phonenumber: string;
	email: string;
	licenseType: string[];
	imageUrl: string;
	locationName: string;
	brandId?: number;
	sendyUserId?: number;
	[property: string]: any;
	store_address?: string;
}

export interface CreateStoreDto {
	locationName: string;
	email: string;
	companyId: string;
	store_address: string;
	timeZone: string;
	website?: string;
	logos?: string[];
	licenseType?: string[];
}
