import { AbilityBuilder, InferSubjects, MongoAbility, createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { User } from 'src/microservices/user/entities/user.entity';

type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
type Subjects = InferSubjects<typeof User> | 'all';

type AppAbility = MongoAbility<[Actions, Subjects]>;

const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

@Injectable()
export class UserAbilityFactory {
	createForUser(userType: USER_TYPE): MongoAbility {
		try {
			if (userType === USER_TYPE.SUPER_ADMIN) {
				can('manage', 'all');
			}

			if (userType === USER_TYPE.ADMIN) {
				cannot('create', User, {
					userType: {
						$eq: [USER_TYPE.SUPER_ADMIN],
					},
				});

				can('create', User, {
					userType: {
						$eq: [USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN],
					},
				});
			}

			if (userType === USER_TYPE.COMPANY_ADMIN) {
				console.log('in the Company Admin');
				can('create', User, {
					userType: {
						$in: [USER_TYPE.STORE_ADMIN, USER_TYPE.MANAGER],
					},
				});

				cannot('create', User, {
					userType: {
						$in: [USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN],
					},
				});
			}

			if (userType === USER_TYPE.STORE_ADMIN) {
				can('create', User, {
					userType: USER_TYPE.MANAGER,
				});
			}

			if (userType === USER_TYPE.MANAGER) {
			}

			return build();
		} catch (error) {
			console.trace(error);
			throw error;
		}
	}
}
