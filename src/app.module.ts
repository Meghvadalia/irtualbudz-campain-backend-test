import { Module } from '@nestjs/common';
import { KafkaModule } from './modules/kafka';
import { MicroserviceClientModule } from './modules/microservice-client';
import { OrderModule } from './microservices/order';
import { DatabaseProviderModule } from './providers/database/mongodb.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './microservices/user/users.module';
// import { InventoryModule } from './microservices/inventory';
// import { ProductModule } from './microservices/product';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV}`,
			isGlobal: true,
		}),

		// Kafka module
		KafkaModule,

		// Microservice modules
		OrderModule,
		// InventoryModule,
		// ProductModule,
		UsersModule,

		// Client module
		MicroserviceClientModule,
	],
})
export class AppModule {}
