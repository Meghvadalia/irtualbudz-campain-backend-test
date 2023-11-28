import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RawTemplate } from 'src/model/rawTemplate/entities/rawTemplate.entity';
import { Template } from 'src/model/template/entities/template.entity';
import { dynamicCatchException } from 'src/utils/error.utils';
import { generateTemplateMessage } from 'src/utils/openai';

@Injectable()
export class ClientTemplateService {
	constructor(
		@InjectModel(Template.name) private readonly templateModel: Model<Template>,
		@InjectModel(RawTemplate.name) private readonly rawTemplateModel: Model<RawTemplate>
	) {}

	async getTemplate(id: string) {
		try {
			const template = await this.templateModel.findById({ _id: new Types.ObjectId(id) }).populate([
				{
					path: 'rawTemplateId',
					select: ['image', 'replacements'],
					model: this.rawTemplateModel,
				},
			]);
			return template;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getTemplateByCampaignId(campaignId: string) {
		try {
			const templateList = await this.templateModel
				.find(
					{ campaignId: new Types.ObjectId(campaignId) },
					{ template: 0, createdAt: 0, updatedAt: 0, __v: 0 }
				)
				.populate([
					{
						path: 'rawTemplateId',
						select: ['image', 'replacements'],
						model: this.rawTemplateModel,
					},
				]);
			return templateList;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async updateTemplate(id: string, data, userId: string) {
		try {
			const template = await this.templateModel.findOneAndUpdate(
				{ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
				{ $set: { ...data } },
				{ new: true }
			);
			return template;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async generateMessage(type: string, prompts: string[]) {
		try {
			let responsePromises;
			if (type === 'product') {
				responsePromises = prompts.map(async (prompt) => {
					return generateTemplateMessage(
						`create a FOMO text for this content "${prompt}". make it one liner`
					);
				});
			} else {
				responsePromises = prompts.map(async (prompt) => {
					return generateTemplateMessage(prompt);
				});
			}

			const responses = await Promise.all(responsePromises);
			const flattenedResponses = responses
				.map((template) => template.map((data) => data.message.content.replace(/^"(.*)"$/, '$1')))
				.flat();

			return flattenedResponses;
		} catch (error) {
			dynamicCatchException(error);
			return [];
		}
	}
}
