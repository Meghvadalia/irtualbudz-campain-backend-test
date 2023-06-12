import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { User } from '../entities/user.entity';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dto/user.dto';
import { passwordService } from 'src/utils/password.util';
import { jwtService } from 'src/utils/token.util';
import { RedisService } from 'src/config/cache/config.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UsersService {
	private readonly redisService;
	constructor(
		@InjectModel(User.name)
		private userModel: Model<User>
	) {
		this.redisService = new RedisService();
	}

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
				const payload = {
					id: user._id,
					userType: user.type,
				};
				const token = jwtService.generateAccessToken(payload);
				const refreshToken = jwtService.generateRefreshToken(payload);
				await this.redisService.setValue('user', JSON.stringify(user));
				return { user, token, refreshToken };
			}

			return 'User not found';
		} catch (error) {
			console.trace(error);
			throw new Error(error);
		}
	}

	async getUser(payload: any) {}
}
