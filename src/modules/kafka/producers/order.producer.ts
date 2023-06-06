import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class OrderProducer {
	private producer: Producer;
	private readonly topic = 'order-topic';
	private readonly groupId = 'order-grup';

	constructor(private readonly kafka: Kafka) {
		this.producer = this.kafka.producer();
	}

	async sendOrderMessage(message: string): Promise<void> {
		await this.producer.connect();
		await this.producer.send({
			topic: this.topic,
			messages: [{ value: message }],
		});
		await this.producer.disconnect();
	}
}
