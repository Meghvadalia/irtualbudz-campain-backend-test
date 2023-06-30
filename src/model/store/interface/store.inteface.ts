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
	[property: string]: any;
}
