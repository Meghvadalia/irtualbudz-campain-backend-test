import { Types } from 'mongoose';

export interface ITemplate {
	template: string;
	rawTemplateId: Types.ObjectId;
	campaignId: Types.ObjectId;
	userId: Types.ObjectId;
	[property: string]: any;
}

export enum TemplateReplaceKey {
	ITEM_IMAGE = '{{item_image}}',
	PRODUCT_NAME = '{{product_name}}',
	PRODUCT_DISCOUNT = '{{product_discount}}',
	PRODUCT_DESC = '{{product_desc}}',
	STORE_LINK = '{{store_link}}',
	CAMPAIGN_NAME = '{{campaign_name}}',
	STORE_LOGO = '{{store_logo}}',
	CAMPAIGN_DATE = '{{campaign_date}}',
	STORE_DESC = '{{store_desc}}',
	CAMPAIGN_IMAGE = '{{campaign_image}}',
	STORE_FB_LINK = '{{store_fb_link}}',
	STORE_TWITTER_LINK = '{{store_twitter_link}}',
	STORE_LINKEDIN_LINK = '{{store_linkedin_link}}',
	STORE_INSTA_LINK = '{{store_insta_link}}',
	STORE_WEB_LINK = '{{store_web_link}}',
	STORE_ADDRESS = '{{store_address}}',
}
