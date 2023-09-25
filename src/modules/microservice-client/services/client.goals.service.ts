import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goals } from 'src/model/goals/entities/goals.entity';
import { dynamicCatchException } from 'src/utils/error.utils';

@Injectable()
export class ClientGoalsService {
	constructor(@InjectModel(Goals.name) private readonly goalsModel: Model<Goals>) {}

	async listAllGoals() {
		try {
			return await this.goalsModel.find({ isActive: true, isDeleted: false }).select(['name']);
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
