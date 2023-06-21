import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema, usersProviders, UsersService, UsersController, UsersResolver } from './index';

import { RedisService } from 'src/config/cache/config.service';
import { RedisModule } from 'src/config/cache/config.module';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';
import { JwtService } from '../../utils/token.util';
import { SessionService } from './service/session.service';
import { Session, SessionSchema } from './entities/session.entity';

@Module({
	imports: [
		DatabaseProviderModule,
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
		RedisModule,
	],
	exports: [UsersService],
	controllers: [UsersController],
	providers: [UsersService, UsersResolver, ...usersProviders, RedisService, JwtService, SessionService],
})
export class UsersModule {}
