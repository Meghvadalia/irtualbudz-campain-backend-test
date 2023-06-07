import { Controller, Get, OnModuleInit, Param } from '@nestjs/common';
import { ClientOrderService } from '../services/client.order.service';
import { ClientGrpc, ClientProxyFactory, RpcException, Transport } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { join } from 'path';

interface IOrderService {
	CreateOrder(data: any): Observable<any>;
	GetOrder(data: any): Observable<any>;
}

@Controller('client-order')
export class ClientOrderController implements OnModuleInit {
	private orderService: IOrderService;
	private client: ClientGrpc;
	private readonly orderMicroservice: ClientGrpc;
	constructor(private readonly clientOrderService: ClientOrderService) {}
	onModuleInit() {
		this.client = ClientProxyFactory.create({
			transport: Transport.GRPC,
			options: {
				package: 'order',
				protoPath: join(__dirname, '../../../proto/order.proto'),
				url: 'localhost:8003',
			},
		});
		this.orderService = this.client.getService<IOrderService>('OrderService');
	}

	@Get('orders/:id')
	async getOrder(@Param('id') id: string) {
		try {
			const order = await firstValueFrom(this.orderService.GetOrder({ name: 1 }));
			return order;
		} catch (error) {
			throw new RpcException(error);
		}
	}
}
