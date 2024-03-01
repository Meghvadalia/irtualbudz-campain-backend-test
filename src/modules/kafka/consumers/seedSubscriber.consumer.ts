import { Injectable, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import {
	KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE,
	SET_SUBSCRIBER_DELAY_TIME,
} from 'src/common/constants';
import { ClientCampaignService } from 'src/modules/microservice-client/services/client.campaign.service';
import { delay } from 'src/utils/time.utils';
@Injectable()
export class SeedSubscriberConsumer implements OnModuleInit {
	private consumer: Consumer;
	private readonly initial_time = KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE.SUBSCRIBER_INITIAL_TIME;
	private readonly schedule_time = KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE.SUBSCRIBER_SCHEDULE_TIME;
	private readonly seedingGroup = KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE.SUBSCRIBER_SEEDING_GROUP;

	constructor(
		private readonly kafka: Kafka,
		private readonly campaignService: ClientCampaignService
	) {
		this.consumer = this.kafka.consumer({ groupId: this.seedingGroup });
	}

	async onModuleInit() {
		await this.consumeSchedulerInfo();
	}

	async consumeSchedulerInfo() {
		try {
			await this.consumer.connect();
			await this.consumer.subscribe({
				topic: this.initial_time,
				fromBeginning: true,
			});

			await this.consumer.subscribe({
				topic: this.schedule_time,
				fromBeginning: true,
			});

			await this.consumer.run({
				autoCommit: true,
				eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
					try {
						const seedingData = JSON.parse(message.value.toString());
						console.log(
							`Received seeding message: ${JSON.stringify(seedingData)}, ${topic}.${partition}`
						);
						const { eventType, companyId } = seedingData;
						if (eventType === KAFKA_SUBSCRIBER_SEEDING_EVENT_TYPE.SUBSCRIBER_INITIAL_TIME) {
							this.campaignService.createTrackingListAndSubscribers(companyId);
						} else {
							delay(SET_SUBSCRIBER_DELAY_TIME)
								.then(async () => {
									this.campaignService.createTrackingListAndSubscribers(companyId);
								})
								.catch((err) => {
									console.error('SCHEDULE_TIME error');
									console.error(err);
								});
						}

						console.log('==============================>');
						await this.consumer.commitOffsets([{ topic, partition, offset: message.offset }]);
					} catch (error) {
						console.error('Error processing campaign message:');
						console.log(error);
					}
				},
			});
		} catch (error) {
			console.error('Kafka consumer error:', error);
		}
	}
}
// Create the code
