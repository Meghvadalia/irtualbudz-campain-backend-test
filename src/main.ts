import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderModule } from './microservices/order';
import { join } from 'path';
import { UsersModule } from './microservices/user/users.module';
import { InventoryModule } from './microservices/inventory';
import { CustomerModule } from './microservices/customers/customer.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: true });
	app.use(cookieParser());
	await app.listen(8000);

	const orderApp = await NestFactory.createMicroservice<MicroserviceOptions>(OrderModule, {
		transport: Transport.GRPC,
		options: {
			package: 'order',
			protoPath: join(__dirname, './proto/order.proto'),
			url: 'localhost:8003',
		},
	});
	await orderApp.listen().then(() => {
		console.log('Order microservice is running');
	});

	const userApp = await NestFactory.createMicroservice<MicroserviceOptions>(UsersModule, {
		transport: Transport.GRPC,
		options: {
			package: 'user',
			protoPath: join(__dirname, './proto/user.proto'),
			url: 'localhost:8002',
		},
	});
	await userApp.listen().then(() => {
		console.log('User microservice is running');
	});

	const customerApp = await NestFactory.createMicroservice<MicroserviceOptions>(CustomerModule, {
		transport: Transport.GRPC,
		options: {
			package: 'customer',
			protoPath: join(__dirname, './proto/customer.proto'),
			url: 'localhost:8004',
		},
	});
	await customerApp.listen().then(() => {
		console.log('Customer microservice is running');
	});

	const InventoryApp = await NestFactory.createMicroservice<MicroserviceOptions>(InventoryModule, {
		transport: Transport.GRPC,
		options: {
			package: 'Inventory',
			protoPath: join(__dirname, './proto/inventory.proto'),
			url: 'localhost:8005',
		},
	});
	await InventoryApp.listen().then(() => {
		console.log('Inventory microservice is running');
	});
}
bootstrap();
