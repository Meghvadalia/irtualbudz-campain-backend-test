import { Module } from '@nestjs/common';
import { ClientOrderController } from './controllers/client.order.controller';
import { ClientOrderService } from './services/client.order.service';
import { SeederService } from 'src/common/seeders/seeders';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { Store, StoreSchema } from 'src/model/store/entities/store.entity';
import { ClientStoreService } from './services/client.store.service';
import { ClientStoreController } from './controllers/client.store.controller';
import { ClientDashboardController } from './controllers/client.dashboard.controller';
import { ClientDashboardService } from './services/client.dashboard.service';
import { Cart, CartSchema } from 'src/microservices/order/entities/cart.entity';
import { Product, ProductSchema } from 'src/microservices/inventory/entities/product.entity';
import { CustomerModule } from 'src/microservices/customers/customer.module';
import { OrderModule } from 'src/microservices/order';
import { InventoryModule } from 'src/microservices/inventory';
import { UsersModule } from 'src/microservices/user/users.module';
import { ClientCustomerService } from './services/client.customer.service';
import { Customer, CustomerSchema } from 'src/microservices/customers/entities/customer.entity';
import { Order, OrderSchema } from 'src/microservices/order/entities/order.entity';
import { ClientUserController } from './controllers/client.user.controller';
import { JwtService } from '../../utils/token.util';
import { MetricsController } from './controllers/metrics.controller';
import { RedisService } from 'src/config/cache/config.service';
import { User, UserSchema } from 'src/microservices/user/entities/user.entity';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: POS.name, schema: POSSchema },
			{ name: Company.name, schema: CompanySchema },
			{ name: Store.name, schema: StoreSchema },
			{ name: Cart.name, schema: CartSchema },
			{ name: Product.name, schema: ProductSchema },
			{ name: Customer.name, schema: CustomerSchema },
			{ name: Order.name, schema: OrderSchema },
			{ name: User.name, schema: UserSchema },
		]),
		CustomerModule,
		OrderModule,
		InventoryModule,
		UsersModule,
	],
	controllers: [ClientOrderController, ClientStoreController, ClientDashboardController, ClientUserController, MetricsController],
	providers: [
		ClientOrderService,
		SeederService,
		ClientStoreService,
		ClientDashboardService,
		ClientCustomerService,
		JwtService,
		RedisService,
	],
})
export class MicroserviceClientModule {}
