import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignTypes } from 'src/model/campaignTypes/entities/campaignTypes.entity';
import { dynamicCatchException } from 'src/utils/error.utils';

@Injectable()
export class ClientCampaignTypeService {
	constructor(@InjectModel(CampaignTypes.name) private readonly campaignTypesModel: Model<CampaignTypes>) {}

	async getCampaignTypes() {
		try {
			return await this.campaignTypesModel
				.find({ isActive: true, isDeleted: false })
				.select('-createdAt -updatedAt -__v -isActive -isDeleted -goal');
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
