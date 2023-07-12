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

			return { user: { email, id, name, phone } };
		} catch (error) {
			throw new RpcException(error);
		}
	}

	@GrpcMethod('UserService', 'Login')
	async login(@Payload() payload: Login): Promise<any> {
		try {
			const { email, password } = payload;
			const { user, token, refreshToken } = await this.usersService.login(
				email,
				password
			);

			return {
				user,
				token,
				refreshToken,
			};
		} catch (error) {
			throw new RpcException(error);
		}
	}

	@GrpcMethod('UserService', 'Logout')
	async logout(@Payload() payload: { userId: string; sessionId: string }) {
		await this.usersService.logout(payload.userId, payload.sessionId);
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
	async generateAccessToken(@Payload() payload) {
		const { refreshToken } = payload;
		const newToken = await this.usersService.generateNewAccessToken(
			refreshToken
		);
		return { accessToken: newToken };
	}
}
