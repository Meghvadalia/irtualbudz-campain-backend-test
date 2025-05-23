import { Controller, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { join } from 'path';
import { sendError } from 'src/utils/request-response.utils';

interface IOrderService {
	CreateOrder(data: any): Observable<any>;
	GetOrder(data: any): Observable<any>;
}

@Controller('client-order')
export class ClientOrderController implements OnModuleInit {
	private orderService: IOrderService;
	private client: ClientGrpc;
	constructor() {}
	onModuleInit() {
		try {
			this.client = ClientProxyFactory.create({
				transport: Transport.GRPC,
				options: {
					package: 'order',
					protoPath: join(__dirname, '../../../proto/order.proto'),
					url: 'localhost:8003',
				},
			});
			this.orderService = this.client.getService<IOrderService>('OrderService');
		} catch (error) {
			return sendError(error.message, error.status);
		}
	}
}
