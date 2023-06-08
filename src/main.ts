import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderModule } from './microservices/order';
import { join } from 'path';
import { UsersModule } from './microservices/user/users.module';
import { InventoryModule } from './microservices/inventory';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
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

	// // Inventory Services
	const InventoryApp = await NestFactory.createMicroservice<MicroserviceOptions>(InventoryModule, {
		transport: Transport.GRPC,
		options: {
			package: 'Inventory',
			protoPath: join(__dirname, './proto/inventory.proto'),
			url: 'localhost:8004',
		},
	});
	await InventoryApp.listen().then(() => {
		console.log('Inventory microservice is running');
	});
}
bootstrap();
