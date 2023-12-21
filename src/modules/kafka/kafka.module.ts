import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { MicroserviceClientModule } from '../microservice-client';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from 'src/model/store/entities/store.entity';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { OrderModule } from 'src/microservices/order';
import { InventoryModule } from 'src/microservices/inventory';
import { CustomerModule } from 'src/microservices/customers';

@Module({
	imports: [
		MicroserviceClientModule,
		OrderModule,
		MongooseModule.forFeature([
			{ name: Store.name, schema: StoreSchema },
			{ name: POS.name, schema: POSSchema },
			{ name: Company.name, schema: CompanySchema },
		]),
		InventoryModule,
		CustomerModule
	],
	providers: [KafkaService],
	exports: [KafkaService],
})
export class KafkaModule {}
