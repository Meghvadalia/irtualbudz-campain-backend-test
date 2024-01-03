import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as path from 'path';
import { UPLOAD_DIRECTORY } from 'src/common/constants';
import { RawTemplate } from 'src/model/rawTemplate/entities/rawTemplate.entity';
import { dynamicCatchException } from 'src/utils/error.utils';
import { createDirectoryIfNotExists, uploadFiles } from 'src/utils/fileUpload';

@Injectable()
export class ClientRawTemplateService {
	constructor(
		@InjectModel(RawTemplate.name) private readonly rawTemplateModel: Model<RawTemplate>
	) {}

	async saveTemplate(data, image: Express.Multer.File) {
		try {
			const directory = path.join(process.cwd(), 'public', UPLOAD_DIRECTORY.TEMPLATE);
			await createDirectoryIfNotExists(directory);

			const filePath = await uploadFiles(image, directory);
			const campaignDataWithFiles = {
				replacements: JSON.parse(data.replacements),
				itemCount: data.itemCount,
				subject: data.subject,
				content: data.content,
				image: filePath[0],
			};
			const emailTemplate = await this.rawTemplateModel.create({ ...campaignDataWithFiles });
			return emailTemplate;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getTemplates() {
		try {
			const templates = await this.rawTemplateModel.find({});
			return templates;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getTemplate(id: string) {
		try {
			const template = await this.rawTemplateModel.findById({ _id: new Types.ObjectId(id) });
			return template;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async updateTemplate(id: string, data) {
		try {
			const template = await this.rawTemplateModel.findByIdAndUpdate(
				{ _id: new Types.ObjectId(id) },
				{ $set: { ...data } },
				{ new: true }
			);
			return template;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getTemplateByItemCount(itemCount: number) {
		try {
			const template = await this.rawTemplateModel.find({ itemCount });
			return template;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async deleteTemplate(id: string) {
		try {
			const template = await this.rawTemplateModel.findByIdAndDelete({
				_id: new Types.ObjectId(id),
			});
			return template;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async uploadImageWithPath(imageUploadPath, image: Express.Multer.File) {
		console.log('imageUploadPath' + imageUploadPath);
		const directory = path.join(
			process.cwd(),
			'public',
			imageUploadPath ? imageUploadPath : UPLOAD_DIRECTORY.TEMPLATE
		);
		await createDirectoryIfNotExists(directory);

		const filePath = await uploadFiles(image, directory);
		console.log(filePath[0]);
		return filePath[0];
	}
}
