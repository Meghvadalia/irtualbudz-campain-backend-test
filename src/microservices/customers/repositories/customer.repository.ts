import { Customer } from '../entities/customer.entity';
import { DATABASE_REPOSITORY } from '../../../common/constants';

export const usersProviders = [
	{
		provide: DATABASE_REPOSITORY.USER_REPOSITORY,
		useValue: Customer,
	},
];
