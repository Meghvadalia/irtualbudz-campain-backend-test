import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store } from 'src/model/store/entities/store.entity';
import { IStore } from 'src/model/store/interface/store.inteface';
import { StoreService } from '../services/store.service';

@Controller('store')
export class StoreController {
	constructor(@InjectModel(Store.name) private storeModel: Model<IStore>, private readonly clientStoreService: StoreService) {}

	@Get('seed-stores')
	async seedStoreList() {
		try {
			return await this.clientStoreService.seedStoreData();
		} catch (error) {
			throw new Error(error);
		}
	}
}
