import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_CUSTOMER_EVENT_TYPE } from 'src/common/constants';

@Injectable()
export class CustomerProducer {
	private producer: Producer;
	private readonly topic = KAFKA_CUSTOMER_EVENT_TYPE.CUSTOMER_TOPIC;
	private readonly groupId = KAFKA_CUSTOMER_EVENT_TYPE.CUSTOMER_GROUP;

	constructor(private readonly kafka: Kafka) {
		this.producer = this.kafka.producer();
	}

	async sendCustomerMessage(
		campaignId: string,
		listId: string,
		eventType: string
	): Promise<void> {
		await this.producer.connect();
		await this.producer.send({
			topic: this.topic,
			messages: [{ value: JSON.stringify({ campaignId, listId, eventType }) }],
		});
		await this.producer.disconnect();
	}
}
