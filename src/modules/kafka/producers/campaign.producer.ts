import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { CAMPAIGN_TOPIC } from 'src/common/constants';

@Injectable()
export class CampaignProducer {
	private readonly producer: Producer;
	private readonly campaignTopic = CAMPAIGN_TOPIC.campaignTopic;

	constructor(private readonly kafka: Kafka) {
		this.producer = this.kafka.producer();
	}

	async sendCampaignMessage(
		campaignId: string,
		startDate: Date,
		endDate: Date,
		eventType: string
	): Promise<void> {
		await this.producer.connect();
		await this.producer.send({
			topic: this.campaignTopic,
			messages: [{ value: JSON.stringify({ campaignId, startDate, endDate, eventType }) }],
		});
	}
}
