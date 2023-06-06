import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, KafkaConfig } from 'kafkajs';
import { OrderConsumer } from './consumers/order.consumer';
import { OrderProducer } from './producers/order.producer';

@Injectable()
export class KafkaService implements OnModuleInit {
	private kafka: Kafka;
	private readonly kafkaConfig: KafkaConfig;
	private orderConsumer: OrderConsumer;
	private orderProducer: OrderProducer;

	constructor() {
		this.kafkaConfig = {
			// clientId: 'your-client-id',
			brokers: ['localhost:9092'],
		};
		this.kafka = new Kafka(this.kafkaConfig);
		this.orderConsumer = new OrderConsumer(this.kafka);
		this.orderProducer = new OrderProducer(this.kafka);
	}

	async onModuleInit(): Promise<void> {
		await this.orderConsumer.consumeOrderMessages();
	}

	getOrderConsumer(): OrderConsumer {
		return this.orderConsumer;
	}

	getOrderProducer(): OrderProducer {
		return this.orderProducer;
	}
}
