import { ObjectType } from '@nestjs/graphql';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { KAFKA_CUSTOMER_EVENT_TYPE } from 'src/common/constants';
import { ClientAudienceCustomerService } from 'src/modules/microservice-client/services/client.audienceCustomer.service';
import axios from 'axios';
import { ClientCustomerService } from 'src/modules/microservice-client/services/client.customer.service';

@Injectable()
export class CustomerConsumer implements OnModuleInit {
	private processedMessages: Set<string> = new Set();

	private consumer: Consumer;
	private readonly topic = KAFKA_CUSTOMER_EVENT_TYPE.CUSTOMER_TOPIC;
	private readonly groupId = KAFKA_CUSTOMER_EVENT_TYPE.CUSTOMER_GROUP;

	constructor(
		private readonly kafka: Kafka,
		private readonly audienceService: ClientAudienceCustomerService,
		private readonly clientCustomerService: ClientCustomerService
	) {
		this.consumer = this.kafka.consumer({ groupId: this.groupId });
	}
	async onModuleInit() {
		await this.consumeCustomerMessages();
	}
	async consumeCustomerMessages(): Promise<void> {
		await this.consumer.connect();
		await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
		await this.consumer.run({
			eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
				const campaignMessage = JSON.parse(message.value.toString());
				console.log(
					`Received customer message: ${JSON.stringify(campaignMessage)}, ${topic}.${partition}`
				);

				const { campaignId, listId, storeObject } = campaignMessage;
				const dataList = await this.audienceService.getCampaignWiseCustomer(campaignId);
				const ids = dataList.map((x) => x.customerId);
				const customerData = await this.clientCustomerService.getCustomerData(ids,storeObject);
				console.log(`Total ${customerData.length} email customers found`);
				const options = {
					method: 'post',
					url: `${process.env.TRACKING_SERVER}/subscriber/add`,
					data: JSON.stringify({ subscriberArray: customerData, listId }),
					headers: {
						'Content-Type': 'application/json',
						Authorization:
							'Basic ' +
							btoa(
								`${process.env.TRACKING_AUTH_USERNAME}:${process.env.TRACKING_AUTH_PASSWORD}`
							).toString(),
					},
				};
				try {
					axios
						.request(options)
						.then((response) => {
							console.log(JSON.stringify(response.data));
						})
						.catch((error) => {
							console.log(error);
						});
				} catch (error) {
					console.log(error);
				}
			},
		});
	}
}
