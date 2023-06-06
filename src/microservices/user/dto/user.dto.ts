import { InputType, Field } from '@nestjs/graphql';
import { IUser } from '../interfaces/user.interface';

@InputType()
export class UserDto implements IUser {
  @Field(() => String, { description: 'Email of the user' })
  readonly email: string;

  @Field(() => String, { description: 'Password of the user' })
  readonly password: string;

  @Field(() => String, { description: 'Name of the user' })
  readonly name: string;

  @Field(() => String, { description: 'Phone number of the user' })
  readonly phone: string;

  @Field(() => String, { description: 'User type' })
  readonly type: string;
}

export class CreateUserDto implements IUser {
  email: string;
  password: string;
  name: string;
  phone: string;
  type: string;
}

export interface Login extends IUser {
  email: string;
  password: string;
}
