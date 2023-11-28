import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goals } from 'src/model/goals/entities/goals.entity';
import { dynamicCatchException, throwBadRequestException } from 'src/utils/error.utils';

@Injectable()
export class ClientGoalService {
	constructor(@InjectModel(Goals.name) private readonly goalModel: Model<Goals>) {}

	async goalsById(id: string): Promise<any> {
		try {
			const goals = await this.goalModel.findById(id);
			if (!goals) throwBadRequestException('Goals not found.');
			return goals;
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
