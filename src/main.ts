import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderModule } from './microservices/order';
import { join } from 'path';
import { UsersModule } from './microservices/user/users.module';
import { AllExceptionsFilter } from './utils/request-response.utils';
import { InventoryModule } from './microservices/inventory';
import { CustomerModule } from './microservices/customers/customer.module';
import helmet from 'helmet';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalFilters(new AllExceptionsFilter());
	app.use(helmet());
	const whitelist = [
		'http://localhost:3000' as string,
		'https://monarc.virtualbudz.com/' as string,
	  ];
	app.enableCors({
		origin:
		   function (origin, callback) {
				if (whitelist.indexOf(origin) !== -1) {
				  console.log('allowed cors for:', origin);
				  callback(null, true);
				} else {
				  console.log('blocked cors for:', origin);
				  callback(new Error('Not allowed by CORS'));
				}
			  }
			,
		
		credentials: true,
		methods: ['GET', 'PUT', 'POST', 'OPTIONS', 'PATCH'],
	  });
	
	await app.listen(8000);

	const orderApp = await NestFactory.createMicroservice<MicroserviceOptions>(
		OrderModule,
		{
			transport: Transport.GRPC,
			options: {
				package: 'order',
				protoPath: join(__dirname, './proto/order.proto'),
				url: 'localhost:8003',
			},
		}
	);
	await orderApp.listen().then(() => {
		console.log('Order microservice is running');
	});

	const userApp = await NestFactory.createMicroservice<MicroserviceOptions>(
		UsersModule,
		{
			transport: Transport.GRPC,
			options: {
				package: 'user',
				protoPath: join(__dirname, './proto/user.proto'),
				url: 'localhost:8002',
			},
		}
	);
	await userApp.listen().then(() => {
		console.log('User microservice is running');
	});

	const customerApp =
		await NestFactory.createMicroservice<MicroserviceOptions>(
			CustomerModule,
			{
				transport: Transport.GRPC,
				options: {
					package: 'customer',
					protoPath: join(__dirname, './proto/customer.proto'),
					url: 'localhost:8004',
				},
			}
		);
	await customerApp.listen().then(() => {
		console.log('Customer microservice is running');
	});

	const InventoryApp =
		await NestFactory.createMicroservice<MicroserviceOptions>(
			InventoryModule,
			{
				transport: Transport.GRPC,
				options: {
					package: 'Inventory',
					protoPath: join(__dirname, './proto/inventory.proto'),
					url: 'localhost:8005',
				},
			}
		);
	await InventoryApp.listen().then(() => {
		console.log('Inventory microservice is running');
	});
}
bootstrap();
