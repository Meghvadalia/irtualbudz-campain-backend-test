import { USER_TYPE } from 'src/microservices/user/constants/user.constant';

import { defineAbility } from '@casl/ability';
import { PERMISSIONS_FOR_DATABASE } from '../constants';

export function defineAbilitiesForUserCreation(user) {
	const ability = defineAbility((can) => {
		if (user.type === USER_TYPE.SUPER_ADMIN) {
			can(PERMISSIONS_FOR_DATABASE.CREATE, [
				USER_TYPE.SUPER_ADMIN,
				USER_TYPE.ADMIN,
				USER_TYPE.COMPANY_ADMIN,
				USER_TYPE.STORE_ADMIN,
				USER_TYPE.MANAGER,
			]);
		}

		if (user.type === USER_TYPE.ADMIN) {
			can(PERMISSIONS_FOR_DATABASE.CREATE, USER_TYPE.COMPANY_ADMIN);
			can(PERMISSIONS_FOR_DATABASE.CREATE, USER_TYPE.STORE_ADMIN);
			can(PERMISSIONS_FOR_DATABASE.CREATE, USER_TYPE.MANAGER);
		}

		if (user.type === USER_TYPE.COMPANY_ADMIN) {
			can(PERMISSIONS_FOR_DATABASE.CREATE, USER_TYPE.STORE_ADMIN);
			can(PERMISSIONS_FOR_DATABASE.CREATE, USER_TYPE.MANAGER);
		}

		if (user.type === USER_TYPE.STORE_ADMIN) {
			can(PERMISSIONS_FOR_DATABASE.CREATE, USER_TYPE.MANAGER);
		}
	});

	return ability;
}
