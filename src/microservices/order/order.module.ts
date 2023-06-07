import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';

@Module({
	imports: [DatabaseProviderModule, MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
	controllers: [OrderController],
	providers: [OrderService],
})
export class OrderModule {}
