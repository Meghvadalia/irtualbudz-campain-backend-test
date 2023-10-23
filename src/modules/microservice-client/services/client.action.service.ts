import { Injectable, NotFoundException, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Action } from 'src/model/actions/entities/actions.entity';
import { dynamicCatchException, throwNotFoundException } from 'src/utils/error.utils';

@Injectable()
export class ClientActionService {
	constructor(@InjectModel(Action.name) private readonly actionModel: Model<Action>) {}

	async getActionList() {
		try {
			const actionList = await this.actionModel
				.find({ isActive: true, isDeleted: false })
				.select(['-createdAt', '-updatedAt', '-__v', '-isDeleted', '-isActive']);
			if (actionList.length === 0) {
				throwNotFoundException('Action list not found.');
			}
			return actionList;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getActionById(id) {
		try {
			return await this.actionModel.findOne({ _id: id });
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async nonTrackableActionList() {
		try {
			const trackableActionList = await this.actionModel
				.find({ isTrackable: false })
				.select(['-createdAt', '-updatedAt', '-__v', '-isDeleted', '-isActive', '-graphId']);
			if (trackableActionList.length === 0) {
				throwNotFoundException('Trackable action list not found.');
			}
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
