import { Injectable, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { CAMPAIGN_TOPIC, KAFKA_CAMPAIGN_EVENT_TYPE } from 'src/common/constants';
import { ClientCampaignService } from 'src/modules/microservice-client/services/client.campaign.service';

@Injectable()
export class CampaignConsumer implements OnModuleInit {
	private consumer: Consumer;
	private readonly campaignTopic = CAMPAIGN_TOPIC.campaignTopic;
	private readonly groupId = CAMPAIGN_TOPIC.campaignGroup;

	constructor(private readonly kafka: Kafka, private readonly campaignService: ClientCampaignService) {
		this.consumer = this.kafka.consumer({ groupId: this.groupId });
	}

	async onModuleInit() {
		await this.consumeSchedulerInfo();
	}

	async consumeSchedulerInfo() {
		try {
			await this.consumer.connect();
			await this.consumer.subscribe({
				topic: this.campaignTopic,
				fromBeginning: true,
			});

			await this.consumer.run({
				autoCommit: true,
				eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
					try {
						const campaignMessage = JSON.parse(message.value.toString());
						console.log(`Received campaign message: ${JSON.stringify(campaignMessage)}, ${topic}.${partition}`);

						const { campaignId, startDate, endDate, eventType } = campaignMessage;
						const campaignStartDate = new Date(startDate);
						const campaignEndDate = new Date(endDate);
						const currentDate = new Date();

						const campaign = await this.campaignService.getCampaign(campaignId);

						if (!campaign) {
							console.error(`Campaign not found: ${campaignId}`);
							return;
						}

						if (eventType === KAFKA_CAMPAIGN_EVENT_TYPE.EVENT_STARTED) {
							const delayMilliseconds = this.calculateDelay(campaignStartDate, currentDate);
							if (delayMilliseconds > 0) {
								await this.delay(delayMilliseconds);
							}
							await this.campaignService.updateStatusToInProgress(campaignId);
						}
						if (eventType === KAFKA_CAMPAIGN_EVENT_TYPE.EVENT_ENDED) {
							const delayMilliseconds = this.calculateDelay(campaignEndDate, currentDate);
							if (delayMilliseconds > 0) {
								await this.delay(delayMilliseconds);
							}
							await this.campaignService.updateStatusToClosed(campaignId);
						}
					} catch (error) {
						console.error('Error processing campaign message:', error);
					}
				},
			});
		} catch (error) {
			console.error('Kafka consumer error:', error);
		}
	}

	calculateDelay(startDate: Date, currentDate: Date): number {
		const delayMilliseconds = startDate.getTime() - currentDate.getTime();
		return delayMilliseconds > 0 ? delayMilliseconds : 0;
	}

	async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
