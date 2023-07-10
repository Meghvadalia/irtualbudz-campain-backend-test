import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { IUser } from 'src/microservices/user/interfaces/user.interface';

interface UserSeeder {
	name: string;
	email: string;
	password: string;
	type: USER_TYPE;
	phone: string;
	companyName: string;
}

export const superAdmin: IUser = {
	email: 'superadmin123@gmail.com',
	password: 'SuperAdmin@123',
	type: USER_TYPE.SUPER_ADMIN,
	name: 'Super Admin',
	phone: '9999999999',
};

export const userArrayForCompany: Array<UserSeeder> = [
	{
		name: 'Monarch Admin',
		email: 'monarchadmin@monarch.com',
		password: 'MonarchAdmin@123',
		type: USER_TYPE.COMPANY_ADMIN,
		phone: '+911234567890',
		companyName: 'Monarc',
	},
	{
		name: 'VirtualBudz Admin',
		email: 'virtualbudzadmin@virtualbudz.com',
		password: 'Virtualbudzadmin@123',
		type: USER_TYPE.COMPANY_ADMIN,
		phone: '+911234567890',
		companyName: 'Virtual Budz',
	},
	{
		name: 'Zen Barn Farms Admin',
		email: 'zenbarnFarmsadmin@zenbarnFarms.com',
		password: 'ZenBarnadmin@123',
		type: USER_TYPE.COMPANY_ADMIN,
		phone: '+911234567890',
		companyName: 'Zen Barn Farms',
	},
];
