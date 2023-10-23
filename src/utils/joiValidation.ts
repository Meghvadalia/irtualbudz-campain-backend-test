import * as Joi from 'joi';

export const updateCampaignSchema = Joi.object({
	campaignName: Joi.string().required(),
	goals: Joi.string().required(),
	campaignType: Joi.string().required(),
	audienceId: Joi.string().required(),
	storeId: Joi.string().required(),
	actions: Joi.string().required(),
	files: Joi.array().items(Joi.string()),
	channels: Joi.array().min(1).items(Joi.string()),
	startDateWithTime: Joi.date().required(),
	endDateWithTime: Joi.date().required(),
	sortBy: Joi.string(),
	sortItem: Joi.array().min(1).items(Joi.string()),
	notes: Joi.string().allow(null),
	discount: Joi.array().min(1).items(Joi.number()),
	discountNote: Joi.array().items(Joi.string()),
	selectedSuggestion: Joi.array().min(1).items(Joi.string()),
	addCartValue: Joi.string().allow(null),
});
