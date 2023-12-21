import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, KafkaConfig } from 'kafkajs';
import { OrderConsumer } from './consumers/order.consumer';
import { OrderProducer } from './producers/order.producer';
import { CampaignConsumer } from './consumers/campaign.consumer';
import { CampaignProducer } from './producers/campaign.producer';
import { ClientCampaignService } from '../microservice-client/services/client.campaign.service';
import { SeedDataProducer } from './producers/dataSeed.producer';
import { SeedDataConsumer } from './consumers/dataSeed.consumer';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Store } from 'src/model/store/entities/store.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Company } from 'src/model/company/entities/company.entity';
import { OrderService } from 'src/microservices/order/services/order.service';
import { CustomerService } from 'src/microservices/customers/service/customer.service';
import { InventoryService } from 'src/microservices/inventory/services/inventory.service';
import { SeederService } from 'src/common/seeders/seeders';
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
	private seedDataProducer: SeedDataProducer;
	private seedDataConsumer: SeedDataConsumer;

	private customerProducer: CustomerProducer;
	private customerConsumer: CustomerConsumer;

	constructor(
		private readonly campaignService: ClientCampaignService,
		@InjectModel(Store.name) private readonly storeModel: Model<Store>,
		@InjectModel(POS.name) private readonly posModel: Model<POS>,
		@InjectModel(Company.name) private readonly companyModel: Model<Company>,
		private readonly orderService: OrderService,
		private readonly customerService: CustomerService,
		private readonly inventoryService: InventoryService,
		// private readonly storeService: SeederService,
		private readonly clientAudienceCustomerService: ClientAudienceCustomerService,
		private readonly clientCustomerService: ClientCustomerService
	) {
		this.kafkaConfig = {
			clientId: 'your-client-id',
			brokers: ['localhost:9092'],
		};
		this.kafka = new Kafka(this.kafkaConfig);
		this.orderConsumer = new OrderConsumer(this.kafka);
		this.orderProducer = new OrderProducer(this.kafka);
		this.campaignProducer = new CampaignProducer(this.kafka);
		this.campaignConsumer = new CampaignConsumer(this.kafka, this.campaignService);
		this.seedDataProducer = new SeedDataProducer(this.kafka);
		this.seedDataConsumer = new SeedDataConsumer(
			this.kafka,
			this.orderService,
			this.storeModel,
			this.posModel,
			this.companyModel,
			this.customerService,
			this.inventoryService
			// this.storeService
		);
		this.customerProducer = new CustomerProducer(this.kafka);
		this.customerConsumer = new CustomerConsumer(
			this.kafka,
			this.clientAudienceCustomerService,
			this.clientCustomerService
		);
	}

	async onModuleInit(): Promise<void> {
		await this.orderConsumer.consumeOrderMessages();
		await this.campaignConsumer.consumeSchedulerInfo();
		await this.seedDataConsumer.consumeSchedulerInfo();
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

	getSeedDataConsumer(): SeedDataConsumer {
		return this.seedDataConsumer;
	}

	getSeedDataProducer(): SeedDataProducer {
		return this.seedDataProducer;
	}
	getCustomerProducer(): CustomerProducer {
		return this.customerProducer;
	}
	getCustomerConsumer(): CustomerConsumer {
		return this.customerConsumer;
	}
}
