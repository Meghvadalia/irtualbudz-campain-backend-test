import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { User, UserSchema } from './entities/user.entity';
import { usersProviders } from './users.repository';
import { UsersController } from './users.controller';
import { UsersResolver } from './resolver/users.resolver';
import { RedisService } from 'src/config/cache/config.service';
import { RedisModule } from 'src/config/cache/config.module';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';

@Module({
	imports: [DatabaseProviderModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), RedisModule],
	exports: [UsersService],
	controllers: [UsersController],
	providers: [UsersService, UsersResolver, ...usersProviders, RedisService],
})
export class UsersModule {}
