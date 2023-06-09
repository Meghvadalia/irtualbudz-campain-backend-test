import { InputType, Field } from '@nestjs/graphql';
import { ICustomer } from '../interfaces/customer.interface';

// @InputType()
// export class UserDto implements ICustomer {
// 	@Field(() => String, { description: 'Email of the user' })
// 	readonly email: string;

// 	@Field(() => String, { description: 'Password of the user' })
// 	readonly password: string;

// 	@Field(() => String, { description: 'Name of the user' })
// 	readonly name: string;

// 	@Field(() => String, { description: 'Phone number of the user' })
// 	readonly phone: string;

// 	@Field(() => String, { description: 'User type' })
// 	readonly type: string;
// }
