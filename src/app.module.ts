import { Module } from '@nestjs/common';
import { KafkaModule } from './modules/kafka';
import { MicroserviceClientModule } from './modules/microservice-client';
import { OrderModule } from './microservices/order';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './microservices/user/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomerModule } from './microservices/customers/customer.module';
// import { InventoryModule } from './microservices/inventory';
// import { ProductModule } from './microservices/product';

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
		// InventoryModule,
		// ProductModule,
		UsersModule,

		// Client module
		MicroserviceClientModule,
	],
})
export class AppModule {}
