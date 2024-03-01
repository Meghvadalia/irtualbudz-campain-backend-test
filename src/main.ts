require('newrelic');
import { NestFactory } from '@nestjs/core';
import OpenAI from 'openai';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderModule } from './microservices/order';
import { join } from 'path';
import { UsersModule } from './microservices/user/users.module';
import { InventoryModule } from './microservices/inventory';
import { CustomerModule } from './microservices/customers/customer.module';
import { AllExceptionsFilter } from './utils/request-response.utils';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { customErrorLogger, customLogger } from './common/middlwares/logging.middleware';

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

console.log = customLogger;
console.error = customErrorLogger;
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe());
	app.useGlobalFilters(new AllExceptionsFilter());
	app.use(helmet());
	app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
	app.use('/public', express.static(join(__dirname, '..', 'public')));

	const whitelist = [
		'http://localhost:3000' as string,
		'https://monarc.virtualbudz.com' as string,
		'https://app.monarchdata.io' as string,
		'https://monarch-staging.virtualbudz.com' as string,
	];
	app.enableCors({
		origin: function (origin, callback) {
			if (!origin) {
				console.log('allowed CORS from unknown', origin);
				callback(null, true);
				return true;
			}

			if (whitelist.indexOf(origin) !== -1) {
				console.log('allowed CORS for:');
				console.log(origin);
				callback(null, true);
			} else {
				console.log('blocked cors for:', origin);
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
		methods: ['GET', 'PUT', 'POST', 'OPTIONS', 'PATCH', 'DELETE'],
	});
	await app.listen(Number(process.env.PORT));

	const orderApp = await NestFactory.createMicroservice<MicroserviceOptions>(OrderModule, {
		transport: Transport.GRPC,
		options: {
			package: 'order',
			protoPath: join(__dirname, './proto/order.proto'),
			url: process.env.ORDER_MICRO_SERVICES + ':' + process.env.ORDER_PORT,
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
			url: process.env.USER_MICRO_SERVICES + ':' + process.env.USER_PORT,
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
			url: process.env.CUSTOMER_MICRO_SERVICES + ':' + process.env.CUSTOMER_PORT,
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
			url: process.env.INVENTORY_MICRO_SERVICES + ':' + process.env.INVENTORY_PORT,
		},
	});
	await InventoryApp.listen().then(() => {
		console.log('Inventory microservice is running');
	});
}
bootstrap();
