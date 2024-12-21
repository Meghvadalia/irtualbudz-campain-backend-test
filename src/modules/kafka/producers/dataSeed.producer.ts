import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_SEEDING_EVENT_TYPE, KAFKA_TREEZ_EVENT_TYPE } from 'src/common/constants';

@Injectable()
export class SeedDataProducer {
	private readonly producer: Producer;

	constructor(private readonly kafka: Kafka) {
		this.producer = this.kafka.producer();
	}

	async sendSeedData(
		companyId: string,
		storeId: string,
		eventType: string,
		posDataId: string,
		utcOffsetForStore: number,
		token?: string
	): Promise<void> {
		await this.producer.connect();
		console.log('sendSeedData =>' + eventType);
		if (eventType == KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME) {
			await this.producer.send({
				topic: KAFKA_SEEDING_EVENT_TYPE.INITIAL_TIME,
				messages: [
					{
						value: JSON.stringify({ companyId, storeId, eventType, posDataId, utcOffsetForStore }),
					},
				],
			});
		} else if (eventType == KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME) {
			await this.producer.send({
				topic: KAFKA_SEEDING_EVENT_TYPE.SCHEDULE_TIME,
				messages: [
					{
						value: JSON.stringify({ companyId, storeId, eventType, posDataId, utcOffsetForStore }),
					},
				],
			});
		} else if (eventType == KAFKA_TREEZ_EVENT_TYPE.TREEZ_INITIAL_TIME) {
			await this.producer.send({
				topic: KAFKA_TREEZ_EVENT_TYPE.TREEZ_INITIAL_TIME,
				messages: [
					{
						value: JSON.stringify({
							companyId,
							storeId,
							eventType,
							posDataId,
							utcOffsetForStore,
						}),
					},
				],
			});
		}
	}
}
