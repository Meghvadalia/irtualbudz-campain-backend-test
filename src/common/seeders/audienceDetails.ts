import { IAudienceDetails } from 'src/modules/microservice-client/interfaces/audienceDetails.interface';
import { AudienceName, AudienceType } from '../constants';

export const audienceDetails: IAudienceDetails[] = [
	{
		name: AudienceName.BIG_SPENDER,
		audienceDescription: 'customer who has a cart value more than the total average cart size',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.FREQUENT_FLYER,
		audienceDescription: 'minimum 2 visits per month',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.VALUE_SHOPPER,
		audienceDescription: 'Lower 50% of who has a cart value less than the total average cart size',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.DABBA_DABBA_DO,
		audienceDescription: 'Purchases of products that belong to the concentrate category',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.JUST_EAT_ALL,
		audienceDescription: 'Purchases of  products that belong to  edibles',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.GENERATION_Z,
		audienceDescription: 'born after 1996 but older than 21',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.GENERATION_X,
		audienceDescription: 'Customers born between 1965-1980',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.MILLENNIAL,
		audienceDescription: 'Customers born between 1981-1996',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.FLOWER_POWER,
		audienceDescription: 'Purchases of products that belongs to the flower category',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.BOOMERS,
		audienceDescription: 'Customers born between 1946-1964',
		type: AudienceType.SYSTEM,
	},
	{
		name: AudienceName.ALL,
		audienceDescription: 'All',
		type: AudienceType.SYSTEM,
	},
];
