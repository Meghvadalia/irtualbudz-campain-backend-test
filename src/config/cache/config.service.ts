import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
	private readonly redisClient: Redis;
	readonly sessionName = 'session';

	constructor() {
		this.redisClient = new Redis({
			host: process.env.REDIS_HOST!,
			port: Number(process.env.REDIS_PORT),
		});
	}

	getClient(): Redis {
		return this.redisClient;
	}

	async setValue(key: string, value: {}): Promise<void> {
		await this.redisClient.hset(this.sessionName, key, JSON.stringify(value));
	}

	async getValue(key: string): Promise<string | null> {
		return await this.redisClient.hget(this.sessionName, key);
	}

	async delValue(key: string): Promise<void> {
		await this.redisClient.hdel(this.sessionName, key);
	}
}
