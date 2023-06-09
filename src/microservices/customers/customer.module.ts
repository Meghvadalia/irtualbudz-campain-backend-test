import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CustomerService } from './customer.service';
import { Customer, CustomerSchema } from './entities/customer.entity';
import { usersProviders } from './customer.repository';
import { CustomerController } from './customer.controller';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';

@Module({
	imports: [
		DatabaseProviderModule,
		MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
		MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
		MongooseModule.forFeature([{ name: POS.name, schema: POSSchema }]),
	],
	exports: [CustomerService],
	controllers: [CustomerController],
	providers: [
		CustomerService,
		// UsersResolver,
		...usersProviders,
	],
})
export class CustomerModule {}
