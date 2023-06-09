import { Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrderService } from '../services/order.service';

@Controller('orders')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@GrpcMethod('OrderService', 'getOrder')
	getOrder(data: any): any {
		try {
			console.log('get Method Called', data);
			return { surname: 78 };
		} catch (error) {
			console.log('GRPC METHOD', error);
		}
	}

	@Get('seed')
	async seedOrders(): Promise<void> {
		try {
			await this.orderService.scheduleCronJob();
		} catch (error) {
			console.log('GRPC METHOD', error);
		}
	}
}
