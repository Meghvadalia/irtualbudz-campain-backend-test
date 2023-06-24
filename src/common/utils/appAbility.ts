import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { USER_TYPE, USER_TYPE_ORDER } from 'src/microservices/user/constants/user.constant';

export function defineAbilitiesFor(user) {
	const { can, build } = new AbilityBuilder(createMongoAbility);

	if (user.role === USER_TYPE.SUPER_ADMIN) {
		can('manage', 'all');
	} else if (user.role === USER_TYPE.ADMIN) {
		can('create', 'User', { type: { $gte: USER_TYPE_ORDER.ADMIN } });
		can('create', 'User', { type: USER_TYPE.COMPANY_ADMIN });
	} else if (user.role === USER_TYPE.COMPANY_ADMIN) {
		can('create', 'User', { type: { $gte: USER_TYPE_ORDER.COMPANY_ADMIN } });
		can('create', 'User', { type: USER_TYPE.STORE_ADMIN });
	} else if (user.role === USER_TYPE.STORE_ADMIN) {
		can('create', 'User', { type: { $gte: USER_TYPE_ORDER.STORE_ADMIN } });
		can('create', 'User', { type: USER_TYPE.MANAGER });
	} else if (user.role === USER_TYPE.MANAGER) {
		can('create', 'User', { type: USER_TYPE.MANAGER });
	}

	return build();
}
