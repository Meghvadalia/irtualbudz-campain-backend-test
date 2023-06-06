import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { AppConfigService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			expandVariables: true,
			load: [configuration],
			validationSchema: Joi.object({
				NODE_ENV: Joi.string().valid('development', 'production', 'local'),
				APP_URL: Joi.string(),
				PORT: Joi.number(),
			}),
		}),
	],
	providers: [ConfigService, AppConfigService],
	exports: [ConfigService, AppConfigService],
})
export class AppConfigModule {}
