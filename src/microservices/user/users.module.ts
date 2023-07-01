import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RedisService } from 'src/config/cache/config.service';
import { RedisModule } from 'src/config/cache/config.module';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';
import { JwtService } from '../../utils/token.util';
import { SessionService } from './service/session.service';
import { Session, SessionSchema } from './entities/session.entity';
import { User, UserSchema } from './entities/user.entity';
import { UsersService } from './service/users.service';
import { UsersController } from './controller/users.controller';
import { UsersResolver } from './resolver/users.resolver';
import { usersProviders } from '../customers';
import { ClientCompanyService } from 'src/modules/microservice-client/services/client.company.service';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { Store, StoreSchema } from 'src/model/store/entities/store.entity';
import { ClientStoreService } from 'src/modules/microservice-client/services/client.store.service';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';

@Module({
	imports: [
		DatabaseProviderModule,
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
		MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
		MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
		MongooseModule.forFeature([{ name: POS.name, schema: POSSchema }]),
		RedisModule,
	],
	exports: [UsersService],
	controllers: [UsersController],
	providers: [
		UsersService,
		UsersResolver,
		...usersProviders,
		RedisService,
		JwtService,
		SessionService,
		ClientCompanyService,
		ClientStoreService,
	],
})
export class UsersModule {}
