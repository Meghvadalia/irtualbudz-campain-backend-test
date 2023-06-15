import { Controller, Get, OnModuleInit, Param } from '@nestjs/common';
import { ClientOrderService } from '../services/client.order.service';
import { ClientGrpc, ClientProxyFactory, RpcException, Transport } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { join } from 'path';

interface ICustomerService {}

@Controller('customer')
export class CustomerController implements OnModuleInit {
	private client: ClientGrpc;
	private readonly customerMicroservice: ClientGrpc;
	constructor(private readonly clientOrderService: ClientOrderService) {}
	onModuleInit() {
		this.client = ClientProxyFactory.create({
			transport: Transport.GRPC,
			options: {
				package: 'customer',
				protoPath: join(__dirname, '../../../proto/customer.proto'),
				url: 'localhost:8004',
			},
		});
	}
}
