import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { MicroserviceClientModule } from '../microservice-client';

@Module({
	imports: [MicroserviceClientModule],
	providers: [KafkaService],
	exports: [KafkaService],
})
export class KafkaModule {}
