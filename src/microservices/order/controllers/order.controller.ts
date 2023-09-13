import { Controller, Get } from '@nestjs/common';
import { OrderService } from '../services/order.service';

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
}
