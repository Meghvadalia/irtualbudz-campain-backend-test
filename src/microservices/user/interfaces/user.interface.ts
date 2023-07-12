import { BaseInterface } from 'src/common/interface';

export interface IUser extends BaseInterface {
	email: string;
	password: string;
	name: string;
	phone: string;
	type: string;
	companyId?: string;
	storeId?: string;
	isActive?: boolean;
}
