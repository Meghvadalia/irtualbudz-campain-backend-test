export const DATABASE_REPOSITORY = {
	USER_REPOSITORY: 'USER_REPOSITORY',
};

export const DATABASE_COLLECTION = {
	POS: 'POS',
	COMPANIES: 'companies',
	STORES: 'stores',
	CUSTOMER: 'customers',
	ORDER: 'orders',
	INVENTORY: 'inventories',
	PRODUCT: 'products',
	CART: 'cart',
	STAFF: 'staff',
	USER: 'users',
	SESSION: 'session',
	GOALS: 'goals',
	AUDIENCE_DETAIL: 'audienceDetails',
	AUDIENCE_CUSTOMERS: 'audienceCustomers',
	CAMPAIGN: 'campaign',
	CHANNELS: 'channel',
	CAMPAIGN_TYPES: 'campaignTypes',
	GRAPH: 'graph',
	ACTIONS: 'actions',
	SUGGESTIONS: 'suggestions',
	DISCOUNTS: 'discounts',
	CAMPAIGN_ASSETS: 'campaignAssets',
	NOTIFICATION: 'notification',
	CATEGORY: 'category',
	EMAIL: 'email',
	RAW_TEMPLATE: 'rawTemplates',
	TEMPLATE: 'templates',
};

export const enum PERMISSIONS_FOR_DATABASE {
	CREATE = 'create',
	READ = 'read',
	UPDATE = 'update',
	DELETE = 'delete',
	MANAGE = 'manage',
	ALL = 'all',
}

export const enum DATE_FORMAT {
	MM_DD_YYYY = 'MM/DD/YYYY',
}
export enum AudienceName {
	BIG_SPENDER = 'Big Spender',
	FREQUENT_FLYER = 'Frequent Flyer',
	VALUE_SHOPPER = 'Value Shopper',
	DABBA_DABBA_DO = 'Dabba Dabba Do',
	JUST_EAT_ALL = 'Just Eat All',
	GENERATION_Z = 'Generation Z 21+',
	GENERATION_X = 'Generation X',
	MILLENNIAL = 'Millennial',
	FLOWER_POWER = 'Flower Power',
	BOOMERS = 'Boomers',
	ALL = 'All',
}

export enum AudienceType {
	SYSTEM = 'system',
	USER = 'user',
}

export type GenerationGroup = AudienceName | string;

export const UPLOAD_DIRECTORY = {
	CAMPAIGN: 'campaign',
	ASSETS: 'assets',
	CATEGORY: 'category',
	TEMPLATE: 'template',
	LOGO: 'logo',
};

export const FILE_UPLOAD_LIMIT = 10;

export const DAYS_OF_WEEK = {
	Sunday: 1,
	Monday: 2,
	Tuesday: 3,
	Wednesday: 4,
	Thursday: 5,
	Friday: 6,
	Saturday: 7,
};

export const CAMPAIGN_TOPIC = {
	campaignTopic: 'campaign-topic',
	campaignGroup: 'campaign-group',
};

export const KAFKA_CAMPAIGN_EVENT_TYPE = {
	EVENT_STARTED: 'event-started',
	EVENT_ENDED: 'event-ended',
};

export const KAFKA_SEEDING_EVENT_TYPE = {
	INITIAL_TIME: 'initial-time',
	SCHEDULE_TIME: 'schedule-time',
	SEEDING_GROUP: 'seeding-group',
};
export const KAFKA_CUSTOMER_EVENT_TYPE = {
	CUSTOMER_TOPIC: 'customer-topic',
	CUSTOMER_GROUP: 'customer-group',
};
