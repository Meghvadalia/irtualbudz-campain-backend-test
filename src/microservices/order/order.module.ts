import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';

@Module({
	imports: [],
	controllers: [OrderController],
	providers: [OrderService],
})
export class OrderModule {}
