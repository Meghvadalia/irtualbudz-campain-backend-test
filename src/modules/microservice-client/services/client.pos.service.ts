import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { dynamicCatchException, throwNotFoundException } from 'src/utils/error.utils';

@Injectable()
export class ClientPosService {
	constructor(
		@InjectModel(POS.name) private posModel: Model<IPOS>,
	) {}

	async posList(req) {
		try {
			return await this.posModel.find({}).select(['-updatedAt', '-createdAt', '-__v']);
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
