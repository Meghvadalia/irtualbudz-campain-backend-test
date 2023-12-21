import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';
import { Cart, CartSchema } from './entities/cart.entity';
import { Staff, StaffSchema } from './entities/staff.entity';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';
import { Store, StoreSchema } from 'src/model/store/entities/store.entity';
import { Customer, CustomerModule, CustomerSchema } from '../customers';
import {
	AudienceCustomer,
	AudienceCustomerSchema,
} from 'src/modules/microservice-client/entities/audienceCustomers.entity';
import {
	AudienceDetail,
	AudienceDetailSchema,
} from 'src/modules/microservice-client/entities/audienceDetails.entity';
import { AudienceDetailsService } from 'src/modules/microservice-client/services/client.audienceDetail.service';
import { Product, ProductSchema } from '../inventory/entities/product.entity';
import { SeedDataProducer } from 'src/modules/kafka/producers/dataSeed.producer';
import { Kafka } from 'kafkajs';

@Module({
	imports: [
		DatabaseProviderModule,
		MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
		MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
		MongooseModule.forFeature([{ name: Staff.name, schema: StaffSchema }]),
		MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
		MongooseModule.forFeature([{ name: POS.name, schema: POSSchema }]),
		MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
		MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
		MongooseModule.forFeature([{ name: AudienceCustomer.name, schema: AudienceCustomerSchema }]),
		MongooseModule.forFeature([{ name: AudienceDetail.name, schema: AudienceDetailSchema }]),
		MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
		MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
		CustomerModule,
	],
	controllers: [OrderController],
	providers: [OrderService, AudienceDetailsService,{
		provide: Kafka,
		useFactory: () => {
			return new Kafka({
				clientId: 'your-client-id',
				brokers: ['localhost:9092'],
			});
		},
	},SeedDataProducer],
	exports: [OrderService],
})
export class OrderModule {}
