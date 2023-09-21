import { Controller, Get } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { sendSuccess } from 'src/utils/request-response.utils';

@Controller('orders')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@Get('seed')
	async seedOrders(): Promise<void> {
		try {
			await this.orderService.scheduleCronJob('flowhub');
		} catch (error) {
			console.error('GRPC METHOD', error);
		}
	}

	@Get('orderType')
	changeOrderType() {
		try {
			this.orderService.migrateOrderType();
			return sendSuccess('Order Type Changed.');
		} catch (error) {
			console.error('Error in order Type', error);
		}
	}
}
