import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashborad.service';
import { CustomerModule } from '../customers/customer.module';
import { OrderModule } from '../order';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '../order/entities/cart.entity';

@Module({
	imports: [CustomerModule, OrderModule, MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }])],
	controllers: [DashboardController],
	providers: [DashboardService],
	exports: [DashboardService],
})
export class DashboardModule {}
