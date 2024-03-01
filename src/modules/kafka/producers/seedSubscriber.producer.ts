import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE } from 'src/common/constants';

@Injectable()
export class SeedSubscriberProducer {
	private readonly producer: Producer;

	constructor(private readonly kafka: Kafka) {
		this.producer = this.kafka.producer();
	}

	async sendSeedSubscriber(companyId: string, eventType: string): Promise<void> {
		await this.producer.connect();
		console.log('sendSeedSubscriber');
		if (eventType == KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE.SUBSCRIBER_INITIAL_TIME) {
			await this.producer.send({
				topic: KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE.SUBSCRIBER_INITIAL_TIME,
				messages: [
					{
						value: JSON.stringify({ companyId, eventType }),
					},
				],
			});
		} else {
			await this.producer.send({
				topic: KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE.SUBSCRIBER_SCHEDULE_TIME,
				messages: [
					{
						value: JSON.stringify({ companyId, eventType }),
					},
				],
			});
		}
	}
}
