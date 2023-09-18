import { Controller, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { sendError } from 'src/utils/request-response.utils';

@Controller('customer')
export class ClientCustomerController implements OnModuleInit {
	private client: ClientGrpc;
	constructor() {}
	onModuleInit() {
		try {
			this.client = ClientProxyFactory.create({
				transport: Transport.GRPC,
				options: {
					package: 'customer',
					protoPath: join(__dirname, '../../../proto/customer.proto'),
					url: 'localhost:8004',
				},
			});
		} catch (error) {
			return sendError(error.message, error.status);
		}
		
	}
}
