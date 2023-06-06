import { Injectable } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
@Injectable()
export class OrderConsumer {
	private consumer: Consumer;
	private readonly topic = 'order-topic';
	private readonly groupId = 'order-group';

	constructor(private readonly kafka: Kafka) {
		this.consumer = this.kafka.consumer({ groupId: this.groupId });
	}

	async consumeOrderMessages(): Promise<void> {
		await this.consumer.connect();
		await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
		await this.consumer.run({
			eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
				const order = message.value.toString();
				console.log(`Received order message: ${order}, ${topic}.${partition}`);
			},
		});
	}
}
