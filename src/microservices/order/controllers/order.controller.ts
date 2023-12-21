import { Controller, Get } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { sendSuccess } from 'src/utils/request-response.utils';
import { SeedDataProducer } from 'src/modules/kafka/producers/dataSeed.producer';
import { KAFKA_SEEDING_EVENT_TYPE } from 'src/common/constants';

@Controller('orders')
export class OrderController {
	constructor(private readonly orderService: OrderService,private readonly seedDataProducer: SeedDataProducer) {}

	@Get('seed')
	async seedOrders(): Promise<void> {
		try {
			// await this.orderService.scheduleCronJob('flowhub');
			await this.seedDataProducer.sendSeedData('flowhub',
				KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME
			);
		} catch (error) {
			console.error('GRPC METHOD', error);
		}
	}

	@Get('orderType')
	changeOrderType() {
		try {
			this.orderService.migrateOrderType();
			return sendSuccess('Order Type Changed.');
		} catch (error) {
			console.error('Error in order Type', error);
		}
	}
}
