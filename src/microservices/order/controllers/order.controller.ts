import { Controller, Get } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { GrpcMethod } from '@nestjs/microservices';

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
}
