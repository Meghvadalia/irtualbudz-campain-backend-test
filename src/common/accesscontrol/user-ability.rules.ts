import { USER_TYPE } from 'src/microservices/user/constants/user.constant';

import { defineAbility } from '@casl/ability';

export function defineAbilitiesForUserCreation(user) {
	const ability = defineAbility((can) => {
		if (user.type === USER_TYPE.SUPER_ADMIN) {

			can('create', USER_TYPE.SUPER_ADMIN);
			can('create', USER_TYPE.ADMIN);
			can('create', USER_TYPE.COMPANY_ADMIN);
			can('create', USER_TYPE.STORE_ADMIN);
			can('create', USER_TYPE.MANAGER);
		}

		if (user.type === USER_TYPE.ADMIN) {
			can('create', USER_TYPE.COMPANY_ADMIN);
			can('create', USER_TYPE.STORE_ADMIN);
			can('create', USER_TYPE.MANAGER);
		}

		if (user.type === USER_TYPE.COMPANY_ADMIN) {
			can('create', USER_TYPE.STORE_ADMIN);
			can('create', USER_TYPE.MANAGER);
		}

		if (user.type === USER_TYPE.STORE_ADMIN) {
			can('create', USER_TYPE.MANAGER);
		}
	});

	return ability;
}
