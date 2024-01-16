import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, KafkaConfig } from 'kafkajs';
import { OrderConsumer } from './consumers/order.consumer';
import { OrderProducer } from './producers/order.producer';
import { CampaignConsumer } from './consumers/campaign.consumer';
import { CampaignProducer } from './producers/campaign.producer';
import { ClientCampaignService } from '../microservice-client/services/client.campaign.service';
import { CustomerConsumer } from './consumers/customer.consumer';
import { CustomerProducer } from './producers/customer.producer';
import { ClientAudienceCustomerService } from '../microservice-client/services/client.audienceCustomer.service';
import { ClientCustomerService } from '../microservice-client/services/client.customer.service';

@Injectable()
export class KafkaService implements OnModuleInit {
	private kafka: Kafka;
	private readonly kafkaConfig: KafkaConfig;
	private orderConsumer: OrderConsumer;
	private orderProducer: OrderProducer;
	private campaignProducer: CampaignProducer;
	private campaignConsumer: CampaignConsumer;
	private customerProducer: CustomerProducer;
	private customerConsumer: CustomerConsumer;

	constructor(
		private readonly campaignService: ClientCampaignService,
		private readonly customerService: ClientAudienceCustomerService,
		private readonly clientCustomerService: ClientCustomerService
	) {
		this.kafkaConfig = {
			clientId: process.env.REDIS_CLIENT,
			brokers: ['localhost:9092'],
		};
		this.kafka = new Kafka(this.kafkaConfig);
		this.orderConsumer = new OrderConsumer(this.kafka);
		this.orderProducer = new OrderProducer(this.kafka);
		this.campaignProducer = new CampaignProducer(this.kafka);
		this.campaignConsumer = new CampaignConsumer(this.kafka, this.campaignService);
		this.customerProducer = new CustomerProducer(this.kafka);
		this.customerConsumer = new CustomerConsumer(
			this.kafka,
			this.customerService,
			this.clientCustomerService
		);
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

	getCustomerProducer(): CustomerProducer {
		return this.customerProducer;
	}
	getCustomerConsumer(): CustomerConsumer {
		return this.customerConsumer;
	}
}
