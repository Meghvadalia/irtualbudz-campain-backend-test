import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session } from '../entities/session.entity';
import { Model } from 'mongoose';
import { ISession } from '../interfaces/session.interface';
import { RedisService } from 'src/config/cache/config.service';
import { JwtService } from 'src/utils/token.util';

@Injectable()
export class SessionService {
	constructor(
		@InjectModel(Session.name) private sessionModel: Model<Session>,
		private readonly redisService: RedisService,
		private readonly jwtService: JwtService
	) {}

	async createSession(userId: string, data: ISession) {
		await this.expireByUser(userId);

		const result = await this.sessionModel.create({
			...data,
			userId,
		});
		const accessTokenPayload = {
			userId,
			type: data.type,
			sessionId: result._id,
		};
		const token = this.jwtService.generateAccessToken(accessTokenPayload);
		const refreshTokenPayload = {
			userId,
			type: data.type,
		};
		const refreshToken = this.jwtService.generateRefreshToken(refreshTokenPayload);

		await this.redisService.setValue(result.userId, { user: { userId, type: result.type } });
		return { token, refreshToken };
	}

	async expireByUser(userId: string) {
		try {
			const result = await this.sessionModel.findOneAndUpdate({ userId }, { status: false });
			await this.redisService.delValue(userId);
			return result;
		} catch (error) {
			throw new Error(error);
		}
	}

	async logout(userId: string, sessionId: string) {
		try {
			await this.sessionModel.findOneAndUpdate({ _id: sessionId }, { $set: { status: false } });
			await this.redisService.delValue(userId);
		} catch (error) {}
	}

	async findSession(userId: string) {
		try {
			return await this.sessionModel.findOne({ userId, status: true });
		} catch (error) {}
	}
}
