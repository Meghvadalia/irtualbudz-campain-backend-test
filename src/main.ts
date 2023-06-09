import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderModule } from './microservices/order';
import { join } from 'path';
import { UsersModule } from './microservices/user/users.module';
import { AllExceptionsFilter } from './utils/request-response.utils';
import helmet from 'helmet';
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalFilters(new AllExceptionsFilter());
	app.use(helmet());
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
}
bootstrap();
