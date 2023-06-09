import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';
import { Cart, CartSchema } from './entities/cart.entity';
import { Staff, StaffSchema } from './entities/staff.entity';


@Module({
	imports: [
		DatabaseProviderModule, 
		MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
		MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
		MongooseModule.forFeature([{name:Staff.name,schema:StaffSchema}])
	],
	controllers: [OrderController],
	providers: [OrderService],
})
export class OrderModule {}
