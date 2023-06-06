import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
	private readonly redisClient: Redis;

	constructor() {
		this.redisClient = new Redis({
			host: process.env.REDIS_HOST!,
			port: Number(process.env.REDIS_PORT),
		});
	}

	getClient(): Redis {
		return this.redisClient;
	}

	async setValue(key: string, value: string): Promise<void> {
		await this.redisClient.set(key, value);
	}

	async getValue(key: string): Promise<string | null> {
		return await this.redisClient.get(key);
	}
}
