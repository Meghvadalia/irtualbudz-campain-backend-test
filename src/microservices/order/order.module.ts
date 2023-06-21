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
import { CustomerModule } from '../customers';
import { CustomerService } from '../customers/service/customer.service';

@Module({
	imports: [
		DatabaseProviderModule,
		MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
		MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
		MongooseModule.forFeature([{ name: Staff.name, schema: StaffSchema }]),
		MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
		MongooseModule.forFeature([{ name: POS.name, schema: POSSchema }]),
		MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
		CustomerModule,
	],
	controllers: [OrderController],
	providers: [OrderService],
	exports: [OrderService],
})
export class OrderModule {}
