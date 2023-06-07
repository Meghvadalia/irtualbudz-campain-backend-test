import { Module } from '@nestjs/common';
import { ClientOrderController } from './controllers/client.order.controller';
import { ClientOrderService } from './services/client.order.service';
import { UserController } from './controllers/user.controller';
import { CustomerController } from './controllers/customer.controller';

@Module({
	imports: [],
	controllers: [ClientOrderController, UserController, CustomerController],
	providers: [ClientOrderService],
})
export class MicroserviceClientModule {}
