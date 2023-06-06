import { Controller, SerializeOptions } from '@nestjs/common';
import { GrpcMethod, Payload, RpcException } from '@nestjs/microservices';

import { extendedUserGroupsForSerializing } from './serializers/user.serializer';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto, Login } from './dto/user.dto';

@Controller('users')
@SerializeOptions({
	groups: extendedUserGroupsForSerializing,
})
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@GrpcMethod('UserService', 'Signup')
	async register(@Payload() payload: CreateUserDto): Promise<any> {
		try {
			const {
				newUser: { id, name, email, phone },
			} = await this.usersService.register(payload);

			return { message: 'SignUp successful', user: { email, id, name, phone } };
		} catch (error) {
			throw new RpcException(error);
		}
	}

	@GrpcMethod('UserService', 'Login')
	async login(@Payload() payload: Login): Promise<any> {
		const { email, password } = payload;
		const {
			user: { id, name, phone },
			token,
			refreshToken,
		} = await this.usersService.login(email, password);

		return {
			message: 'Logged-In successfully.',
			user: {
				email,
				id,
				name,
				phone,
				token,
			},
			refreshToken,
		};
	}

	@GrpcMethod('UserService', 'info')
	async getUser(@Payload() payload: Login): Promise<User | void> {
		const { email } = payload;
		const user = await this.usersService.getUser(email);

		return user;
	}
}
