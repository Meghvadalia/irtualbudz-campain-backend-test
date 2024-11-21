import * as Joi from 'joi';

export const CreateCompanySchema = Joi.object({
	companyName: Joi.string().min(3).max(30).required(),
	posName: Joi.string().required(),
	dataObject: Joi.object().required(),
});
