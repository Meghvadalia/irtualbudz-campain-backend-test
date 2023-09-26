import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, KafkaConfig } from 'kafkajs';
import { OrderConsumer } from './consumers/order.consumer';
import { OrderProducer } from './producers/order.producer';
import { CampaignConsumer } from './consumers/campaign.consumer';
import { CampaignProducer } from './producers/campaign.producer';
import { ClientCampaignService } from '../microservice-client/services/client.campaign.service';

@Injectable()
export class KafkaService implements OnModuleInit {
	private kafka: Kafka;
	private readonly kafkaConfig: KafkaConfig;
	private orderConsumer: OrderConsumer;
	private orderProducer: OrderProducer;
	private campaignProducer: CampaignProducer;
	private campaignConsumer: CampaignConsumer;

	constructor(private readonly campaignService: ClientCampaignService) {
		this.kafkaConfig = {
			clientId: 'your-client-id',
			brokers: ['localhost:9092'],
		};
		this.kafka = new Kafka(this.kafkaConfig);
		this.orderConsumer = new OrderConsumer(this.kafka);
		this.orderProducer = new OrderProducer(this.kafka);
		this.campaignProducer = new CampaignProducer(this.kafka);
		this.campaignConsumer = new CampaignConsumer(this.kafka, this.campaignService);
	}

	async onModuleInit(): Promise<void> {
		await this.orderConsumer.consumeOrderMessages();
		await this.campaignConsumer.consumeSchedulerInfo();
	}

	getOrderConsumer(): OrderConsumer {
		return this.orderConsumer;
	}

	getOrderProducer(): OrderProducer {
		return this.orderProducer;
	}

	getCampaignConsumer(): CampaignConsumer {
		return this.campaignConsumer;
	}

	getCampaignProducer(): CampaignProducer {
		return this.campaignProducer;
	}
}
