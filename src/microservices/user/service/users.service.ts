import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { User } from '../entities/user.entity';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dto/user.dto';
import { passwordService } from 'src/utils/password.util';
import { JwtService } from 'src/utils/token.util';
import { RpcException } from '@nestjs/microservices';
import { SessionService } from './session.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private userModel: Model<User>,
		private readonly sessionService: SessionService,
		private readonly jwtService: JwtService
	) {}

	async register(payload: CreateUserDto) {
		const emailExists = await this.findByEmail(payload.email);
		if (emailExists) throw new RpcException('Email is already taken.');

		const newUser = await this.userModel.create({ ...payload });
		return { newUser };
	}

	async findByEmail(email: string): Promise<any> {
		return this.userModel.findOne({ email }).exec();
	}

	async login(email: string, password: string): Promise<any> {
		try {
			const user = (await this.findByEmail(email)) as User;
			const comparepassword = await passwordService.comparePasswords(password, user.password);
			if (user && comparepassword) {
				const accessTokenPayload = {
					id: user._id,
					userType: user.type,
				};
				const token = this.jwtService.generateAccessToken(accessTokenPayload);
				const refreshTokenPayload = {
					id: user._id,
					userType: user.type,
					accessToken: token,
				};
				const refreshToken = this.jwtService.generateRefreshToken(refreshTokenPayload);

				const session = await this.sessionService.createSession(user._id, { userId: user._id, type: 'ADMIN' });
				return { user, token, refreshToken };
			}

			return 'User not found';
		} catch (error) {
			console.trace(error);
			throw new Error(error);
		}
	}

	async findById(payload: any): Promise<User | any> {
		const user = await this.userModel.findById(payload).exec();
		return user;
	}

	async generateNewAccessToken(accessToken: string) {
		const decodedToken = this.jwtService.verifyAccessToken(accessToken);

		// @ts-ignore
		const user = await this.findById(decodedToken.id);
		const payload = {
			id: user._id,
			type: user.userType,
		};

		if (user) {
			const newToken = this.jwtService.generateAccessToken(payload);
			return newToken;
		}
	}

	async logout(userId: string) {
		try {
			await this.sessionService.logout(userId);
		} catch (error) {}
	}
}
