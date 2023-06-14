import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session } from '../entities/session.entity';
import { Model } from 'mongoose';
import { ISession } from '../interfaces/session.interface';
import { RedisService } from 'src/config/cache/config.service';

@Injectable()
export class SessionService {
	constructor(@InjectModel(Session.name) private sessionModel: Model<Session>, private readonly redisService: RedisService) {}

	async createSession(userId: string, data: ISession) {
		await this.expireByUser(userId);

		const result = await this.sessionModel.create({
			...data,
			userId,
		});

		await this.redisService.setValue(result.userId, { user: { userId, type: result.type } });
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

	async logout(userId: string) {
		try {
			await this.sessionModel.findOneAndUpdate({ userId }, { status: false });
			await this.redisService.delValue(userId);
		} catch (error) {}
	}
}
