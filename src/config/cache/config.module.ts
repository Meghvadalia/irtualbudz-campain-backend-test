import { Module } from '@nestjs/common';
import { RedisService } from './config.service';

@Module({
	providers: [RedisService],
	exports: [RedisService],
})
export class RedisModule {}
