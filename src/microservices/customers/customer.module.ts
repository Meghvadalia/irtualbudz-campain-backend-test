import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CustomerService } from './customer.service';
import { Customer, CustomerSchema } from './entities/customer.entity';
import { usersProviders } from './customer.repository';
import { CustomerController } from './customer.controller';
// import { UsersResolver } from './resolver/customer.resolver';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';

@Module({
	imports: [DatabaseProviderModule, MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }])],
	exports: [CustomerService],
	controllers: [CustomerController],
	providers: [
		CustomerService,
		// UsersResolver,
		...usersProviders,
	],
})
export class CustomerModule {}
