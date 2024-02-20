import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AudienceDetail } from '../entities/audienceDetails.entity';
import { dynamicCatchException } from 'src/utils/error.utils';

@Injectable()
export class AudienceDetailsService {
	constructor(
		@InjectModel(AudienceDetail.name)
		private audienceDetailsModel: Model<AudienceDetail>
	) {}

	async getAudienceIdByName(name: string) {
		try {
			const audienceId = await this.audienceDetailsModel.findOne<AudienceDetail>({ name });
			return audienceId;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getAudienceDetailById(id: string) {
		try {
			const audienceId = await this.audienceDetailsModel.findById<AudienceDetail>({
				_id: new Types.ObjectId(id),
			});
			return audienceId;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getAllAudiences() {
		try {
			const allAudiences = await this.audienceDetailsModel.find({ isActive: true }).select({
				name: 1,
				_id: 1,
				audienceDescription: 1,
				isActive: 1,
				isDeleted: 1,
				type: 1,
			});
			return allAudiences;
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
