import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { KafkaModule } from './modules/kafka';
import { MicroserviceClientModule } from './modules/microservice-client';
import { OrderModule } from './microservices/order';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './microservices/user/users.module';
import { LoggingMiddleware } from './common/middlwares/logging.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryModule } from './microservices/inventory';
import { CustomerModule } from './microservices/customers/customer.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV}`,
			isGlobal: true,
		}),
		ScheduleModule.forRoot(),

		// Kafka module
		KafkaModule,

		// Microservice modules
		OrderModule,
		CustomerModule,
		InventoryModule,
		UsersModule,

		// Client module
		MicroserviceClientModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggingMiddleware).forRoutes('*');
	}
}
