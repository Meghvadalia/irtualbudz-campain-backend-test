import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { User } from '../entities/user.entity';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dto/user.dto';
import { passwordService } from 'src/utils/password.util';
import { JwtService } from 'src/utils/token.util';
import { RpcException } from '@nestjs/microservices';
import { SessionService } from './session.service';
import { ClientCompanyService } from 'src/modules/microservice-client/services/client.company.service';
import { ClientStoreService } from 'src/modules/microservice-client/services/client.store.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private userModel: Model<User>,
		private readonly sessionService: SessionService,
		private readonly jwtService: JwtService,
		private readonly clientCompanyService: ClientCompanyService,
		private readonly clientStoreService: ClientStoreService
	) {}

	async register(payload: CreateUserDto) {
		const emailExists = await this.findByEmail(payload.email);
		if (emailExists) throw new RpcException('Email is already taken.');

		if (payload.companyId) {
			const company = await this.clientCompanyService.company(
				payload.companyId
			);
			if (!company) throw new RpcException('Company Can not be found');
			payload.companyId = company._id;
		} else {
			const store = await this.clientStoreService.storeById(
				payload.storeId
			);
			if (!store)
				throw new RpcException('Store Can not be found with this ID');
			payload.storeId = store._id;
			payload.companyId = store.companyId;
		}

		const newUser = await this.userModel.create({ ...payload });
		return { newUser };
	}

	async findByEmail(email: string): Promise<any> {
		const user = this.userModel.findOne({ email }).exec();
		if (!user) return 'Email is not registered!!';
		return user;
	}

	async login(email: string, password: string): Promise<any> {
		try {
			const user = (await this.findByEmail(email)) as User;
			if (!user) return 'Email not found!!';
			const comparePassword = await passwordService.comparePasswords(
				password,
				user.password
			);
			if (user && comparePassword) {
				const { token, refreshToken } =
					await this.sessionService.createSession(user._id, {
						userId: user._id,
						type: user.type,
					});
				return { user, token, refreshToken };
			}

			return 'User not found';
		} catch (error) {
			throw new Error(error);
		}
	}

	async findById(payload: any): Promise<User | any> {
		const user = await this.userModel.findById(payload).exec();
		return user;
	}

	async generateNewAccessToken(refreshToken: string) {
		const decodedToken = this.jwtService.verifyRefreshToken(refreshToken);

		// @ts-ignore
		const user = await this.findById(decodedToken.id);
		const session = await this.sessionService.findSession(user._id);

		if (user) {
			const payload = {
				id: user._id,
				type: user.type,
				sessionId: session._id,
			};
			const newToken = this.jwtService.generateAccessToken(payload);
			return newToken;
		}
		return 'User not found.';
	}

	async logout(userId: string, sessionId: string) {
		try {
			await this.sessionService.logout(userId, sessionId);
		} catch (error) {}
	}
}
