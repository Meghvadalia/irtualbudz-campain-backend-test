import { Controller, SerializeOptions } from '@nestjs/common';
import { GrpcMethod, Payload, RpcException } from '@nestjs/microservices';

import { extendedUserGroupsForSerializing } from '../serializers/user.serializer';
import { UsersService } from '../service/users.service';
import { User } from '../entities/user.entity';
import { CreateUserDto, Login } from '../dto/user.dto';

@Controller()
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

	@GrpcMethod('UserService', 'Logout')
	async logout(@Payload() payload: { userId: string }) {
		const user = await this.usersService.logout(payload.userId);
		return {
			message: 'Logged-out successfully.',
		};
	}

	@GrpcMethod('UserService', 'info')
	async getUser(@Payload() payload): Promise<User | void> {
		const { email } = payload;
		const user = await this.usersService.findByEmail(email);

		return user;
	}

	@GrpcMethod('UserService', 'AccessToken')
	async generateRefreshToken(@Payload() payload) {
		const { accessToken } = payload;
		const newToken = await this.usersService.generateNewAccessToken(accessToken);
		return { accessToken: newToken };
	}
}
