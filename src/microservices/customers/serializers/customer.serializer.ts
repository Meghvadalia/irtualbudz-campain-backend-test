import { Expose } from 'class-transformer';
import { ICustomer } from '../interfaces/customer.interface';

export const defaultUserGroupsForSerializing: string[] = ['user.timestamps'];
export const extendedUserGroupsForSerializing: string[] = [...defaultUserGroupsForSerializing];
export const allUserGroupsForSerializing: string[] = [...extendedUserGroupsForSerializing, 'user.password'];

// export class UserEntity implements ICustomer {
// 	email: string;
// 	@Expose({ groups: ['user.password'], name: 'password', toPlainOnly: true })
// 	password: string;
// 	name: string;
// 	phone: string;
// 	type: string;
// 	@Expose({ groups: ['user.timestamps'] })
// 	createdAt: Date;
// 	@Expose({ groups: ['user.timestamps'] })
// 	updatedAt: Date;
// }
