import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import configuration from './configuration';
import { MongodbConfigService } from './config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: Joi.object({
        MONGODB_PROTOCOL: Joi.string(),
        MONGODB_HOST: Joi.string(),
        MONGODB_PORT: Joi.number(),
        MONGODB_DATABASE: Joi.string(),
      }),
    }),
  ],
  providers: [ConfigService, MongodbConfigService],
  exports: [ConfigService, MongodbConfigService],
})
export class MongodbConfigModule {}
