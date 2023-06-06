import { Module } from '@nestjs/common';
import { ClientOrderController } from './controllers/client.order.controller';
import { ClientOrderService } from './services/client.order.service';
import { UserController } from './controllers/user.controller';

@Module({
	imports: [],
	controllers: [ClientOrderController, UserController],
	providers: [ClientOrderService],
})
export class MicroserviceClientModule {}
