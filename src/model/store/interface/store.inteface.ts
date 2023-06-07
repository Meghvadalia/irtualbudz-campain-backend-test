import { Document } from 'mongoose';
import { IAddress, ILocation, IhoursOfOperation } from 'src/common/interface';
import { ICompany } from 'src/model/company/interface/company.interface';

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

	// Add more properties as needed
}
