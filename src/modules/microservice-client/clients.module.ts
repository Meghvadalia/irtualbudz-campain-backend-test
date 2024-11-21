import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ClientOrderController } from './controllers/client.order.controller';
import { ClientOrderService } from './services/client.order.service';
import { SeederService } from 'src/common/seeders/seeders';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { Store, StoreSchema } from 'src/model/store/entities/store.entity';
import { ClientStoreService } from './services/client.store.service';
import { ClientStoreController } from './controllers/client.store.controller';
import { ClientDashboardController } from './controllers/client.dashboard.controller';
import { ClientDashboardService } from './services/client.dashboard.service';
import { Cart, CartSchema } from 'src/microservices/order/entities/cart.entity';
import { Product, ProductSchema } from 'src/microservices/inventory/entities/product.entity';
import { CustomerModule } from 'src/microservices/customers/customer.module';
import { OrderModule } from 'src/microservices/order';
import {
	Inventory,
	InventoryModule,
	InventorySchema,
	InventoryService,
} from 'src/microservices/inventory';
import { UsersModule } from 'src/microservices/user/users.module';
import { ClientCustomerService } from './services/client.customer.service';
import { Customer, CustomerSchema } from 'src/microservices/customers/entities/customer.entity';
import { Order, OrderSchema } from 'src/microservices/order/entities/order.entity';
import { ClientUserController } from './controllers/client.user.controller';
import { JwtService } from '../../utils/token.util';
import { MetricsController } from './controllers/metrics.controller';
import { RedisService } from 'src/config/cache/config.service';
import { User, UserSchema } from 'src/microservices/user/entities/user.entity';
import { DutchieController } from './controllers/dutchie.controller';
import { Staff, StaffSchema } from 'src/microservices/order/entities/staff.entity';
import { FlowhubController } from './controllers/flowhub.controller';
import { ClientCompanyController } from './controllers/client.company.controller';
import { ClientCompanyService } from './services/client.company.service';
import { AudienceDetail, AudienceDetailSchema } from './entities/audienceDetails.entity';
import { AudienceDetailsService } from './services/client.audienceDetail.service';
import { AudienceCustomer, AudienceCustomerSchema } from './entities/audienceCustomers.entity';
import { AudienceDetailsController } from './controllers/client.audienceDetails.controller';
import { ClientAudienceCustomerService } from './services/client.audienceCustomer.service';
import { AudienceCustomerController } from './controllers/client.audienceCustomer.controller';
import { ClientGraphService } from './services/client.graph.service';
import { ClientGoalService } from './services/client.goal.service';
import { ClientChannelController } from './controllers/client.channels.controller';
import { ClientChannelService } from './services/client.channels.service';
import { Goals, GoalsSchema } from 'src/model/goals/entities/goals.entity';
import { Channel, ChannelSchema } from 'src/model/channels/entities/channel.entity';
import { ClientGoalsController } from './controllers/client.goals.controller';
import { ClientGoalsService } from './services/client.goals.service';
import { ClientCampaignTypeService } from './services/client.campaignTypes.service';
import {
	CampaignTypes,
	CampaignTypesSchema,
} from 'src/model/campaignTypes/entities/campaignTypes.entity';
import { ClientCampaignTypeController } from './controllers/client.campaignTypes.controller';
import { Action, ActionSchema } from 'src/model/actions/entities/actions.entity';
import { ClientActionController } from './controllers/client.action.controller';
import { ClientActionService } from './services/client.action.service';
import { Suggestions, SuggestionsSchema } from 'src/model/suggestions/entities/suggestions.entity';
import { ClientCampaignController } from './controllers/client.campaign.controller';
import { ClientCampaignService } from './services/client.campaign.service';
import { Campaign, CampaignSchema } from './entities/campaign.entity';
import { ClientSuggestionService } from './services/client.suggestion.service';
import { Graph, GraphSchema } from 'src/model/graph/entities/graph.entity';
import { ClientSuggestionController } from './controllers/client.suggestion.controller';
import { ClientGraphController } from './controllers/client.graph.controller';
import {
	CampaignAsset,
	CampaignAssetsSchema,
} from 'src/model/campaignAssets/entities/campaignAsset.entity';
import { ClientNotificationController } from './controllers/client.notification.controller';
import { ClientNotificationService } from './services/client.notification.service';
import {
	NotificationSchema,
	Notification,
} from 'src/model/notification/entities/notification.entity';
import { Kafka } from 'kafkajs';
import { CampaignProducer } from '../kafka/producers/campaign.producer';
import { BasicAuthMiddleware } from 'src/common/middlwares/basicAuth.middleware';
import { Category, CategorySchema } from 'src/model/category/entities/category.entity';
import { ClientCategoryController } from './controllers/client.category.controller';
import { ClientCategoryService } from './services/client.category.service';
import { RawTemplate, RawTemplateSchema } from 'src/model/rawTemplate/entities/rawTemplate.entity';
import { ClientRawTemplateService } from './services/client.rawTemplate.service';
import { ClientRawTemplateController } from './controllers/client.rawTemplate.controller';
import { Template, TemplateSchema } from 'src/model/template/entities/template.entity';
import { ClientTemplateController } from './controllers/client.template.controller';
import { ClientTemplateService } from './services/client.template.service';
import { CustomerConsumer } from '../kafka/consumers/customer.consumer';
import { CustomerProducer } from '../kafka/producers/customer.producer';
import { SeedDataConsumer } from '../kafka/consumers/dataSeed.consumer';
import { SeedDataProducer } from '../kafka/producers/dataSeed.producer';
import { ClientReportService } from './services/client.report.service';
import { ClientReportController } from './controllers/client.report.controller';
import { SeedSubscriberConsumer } from '../kafka/consumers/seedSubscriber.consumer';
import { SeedSubscriberProducer } from '../kafka/producers/seedSubscriber.producer';
// import { ClientMaryJanePosController } from './controllers/client.maryJanePos.controller';
import { ClientPosService } from './services/client.pos.service';
// import { ClientMaryJaneCompanyController } from './controllers/client.maryJaneCompany.controller';
// import { ClientMaryJaneStoreController } from './controllers/client.maryJaneStore.controller';
// import { ClientMaryJaneDashboardController } from './controllers/client.maryJaneDashboard.controller';
import { ClientMaryJaneController } from './controllers/client.maryJane.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: POS.name, schema: POSSchema },
			{ name: Company.name, schema: CompanySchema },
			{ name: Store.name, schema: StoreSchema },
			{ name: Cart.name, schema: CartSchema },
			{ name: Product.name, schema: ProductSchema },
			{ name: Customer.name, schema: CustomerSchema },
			{ name: Order.name, schema: OrderSchema },
			{ name: User.name, schema: UserSchema },
			{ name: Inventory.name, schema: InventorySchema },
			{ name: Staff.name, schema: StaffSchema },
			{ name: Graph.name, schema: GraphSchema },
			{ name: Goals.name, schema: GoalsSchema },
			{ name: AudienceDetail.name, schema: AudienceDetailSchema },
			{ name: AudienceCustomer.name, schema: AudienceCustomerSchema },
			{ name: Channel.name, schema: ChannelSchema },
			{ name: Goals.name, schema: GoalsSchema },
			{ name: CampaignTypes.name, schema: CampaignTypesSchema },
			{ name: Action.name, schema: ActionSchema },
			{ name: Suggestions.name, schema: SuggestionsSchema },
			{ name: Graph.name, schema: GraphSchema },
			{ name: Campaign.name, schema: CampaignSchema },
			{ name: CampaignAsset.name, schema: CampaignAssetsSchema },
			{ name: Notification.name, schema: NotificationSchema },
			{ name: Category.name, schema: CategorySchema },
			{ name: RawTemplate.name, schema: RawTemplateSchema },
			{ name: Template.name, schema: TemplateSchema },
		]),
		CustomerModule,
		OrderModule,
		InventoryModule,
		UsersModule,
	],
	controllers: [
		ClientOrderController,
		ClientStoreController,
		ClientDashboardController,
		ClientUserController,
		MetricsController,
		DutchieController,
		FlowhubController,
		ClientCompanyController,
		AudienceDetailsController,
		AudienceCustomerController,
		ClientChannelController,
		ClientGoalsController,
		ClientCampaignTypeController,
		ClientActionController,
		ClientCampaignController,
		ClientSuggestionController,
		ClientGraphController,
		ClientNotificationController,
		ClientCategoryController,
		ClientRawTemplateController,
		ClientTemplateController,
		ClientReportController,
		ClientMaryJaneController,
	],
	providers: [
		{
			provide: Kafka,
			useFactory: () => {
				return new Kafka({
					clientId: process.env.REDIS_CLIENT,
					brokers: ['localhost:9092'],
				});
			},
		},
		ClientOrderService,
		SeederService,
		ClientStoreService,
		ClientDashboardService,
		ClientCustomerService,
		JwtService,
		RedisService,
		InventoryService,
		ClientCompanyService,
		AudienceDetailsService,
		ClientAudienceCustomerService,
		ClientChannelService,
		ClientGoalsService,
		ClientCampaignTypeService,
		ClientActionService,
		ClientCampaignService,
		ClientSuggestionService,
		ClientGoalService,
		ClientGraphService,
		ClientNotificationService,
		CampaignProducer,
		ClientCategoryService,
		ClientRawTemplateService,
		ClientTemplateService,
		CustomerConsumer,
		CustomerProducer,
		SeedDataProducer,
		SeedDataConsumer,
		ClientReportService,
		SeedSubscriberConsumer,
		SeedSubscriberProducer,
		ClientPosService,
	],
	exports: [
		AudienceDetailsService,
		ClientCampaignService,
		ClientAudienceCustomerService,
		ClientCustomerService,
	],
})
export class MicroserviceClientModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(BasicAuthMiddleware).forRoutes(
			{ path: 'user/login', method: RequestMethod.POST },
			{ path: 'user/register', method: RequestMethod.POST },
			{ path: 'mary-jane/company/create', method: RequestMethod.POST },
			{ path: 'mary-jane/store/create', method: RequestMethod.POST },
			{ path: 'mary-jane/pos/list', method: RequestMethod.GET },
			{ path: 'mary-jane/dashboard/:companyId', method: RequestMethod.GET }
			// { path: 'store/companyStoreList/:companyId', method: RequestMethod.POST },
			// { path: 'store/getStoreWiseBrand/:storeId', method: RequestMethod.GET }
		);
	}
}
