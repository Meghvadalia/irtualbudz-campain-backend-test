import * as Joi from 'joi';

export const CreateStoreSchema = Joi.object({
	locationName: Joi.string().min(3).max(30).required(),
	email: Joi.string().email().required(),
	companyId: Joi.string().max(24).min(24).required(),
	store_address: Joi.string().optional(),
	timeZone: Joi.string().default('US/Mountain').required(),
});
