import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_SEEDING_EVENT_TYPE } from 'src/common/constants';

@Injectable()
export class SeedDataProducer {
	private readonly producer: Producer;

	constructor(private readonly kafka: Kafka) {
		this.producer = this.kafka.producer();
	}

	async sendSeedData(POSName: string, eventType: string): Promise<void> {
		await this.producer.connect();
		if (eventType == KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME) {
			await this.producer.send({
				topic: KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME,
				messages: [{ value: JSON.stringify({ POSName, eventType }) }],
			});
		} else {
			await this.producer.send({
				topic: KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME,
				messages: [{ value: JSON.stringify({ POSName, eventType }) }],
			});
		}
	}
}
