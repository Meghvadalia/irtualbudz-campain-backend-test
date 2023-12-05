import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
	private readonly redisClient: Redis;
	readonly sessionName = 'session';

	constructor() {
		const redisOptions: Record<string, any> = {
			host: process.env.REDIS_HOST,
			port: Number(process.env.REDIS_PORT),
		};
		if (process.env.NODE_ENV === 'production') {
			redisOptions.password = process.env.REDIS_PASSWORD;
		}
		this.redisClient = new Redis(redisOptions);
	}

	getClient(): Redis {
		return this.redisClient;
	}

	async setValue(key: string, value: object): Promise<void> {
		await this.redisClient.hset(this.sessionName, key, JSON.stringify(value));
	}

	async getValue(key: string): Promise<string | null> {
		return await this.redisClient.hget(this.sessionName, key);
	}

	async delValue(key: string): Promise<void> {
		await this.redisClient.hdel(this.sessionName, key);
	}
}
