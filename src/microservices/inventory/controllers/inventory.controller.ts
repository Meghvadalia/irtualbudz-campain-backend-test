import { Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import axios from 'axios';
import { Inventory } from '../entities/inventory.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';

@Controller('inventory')
export class InventoryController {
	constructor(@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>) {}

	@GrpcMethod('InventoryService', 'getInventory')
	getInventory(data: any): any {
		try {
			console.log('get Method Called', data);
			return { surname: 78 };
		} catch (error) {
			console.log('GRPC METHOD', error);
		}
	}

	@Cron('0 0 0 * * *', {
		timeZone: 'Asia/Kolkata',
	})
	@Get("seed")
	async seedInventory(): Promise<void> {
		try {
			const options = {
				method: 'get',
				url: `${process.env.FLOWHUB_URL}/v0/locations/147/inventory`,
				headers: {
					key: process.env.FLOWHUB_KEY,
					ClientId: process.env.FLOWHUB_CLIENT_ID,
					Accept: 'application/json',
				},
			};
			try {
				const { data } = await axios.request(options);
				const inventoryDataArray = data.data;
				// console.log(JSON.stringify(data));
				for (let index = 0; index < inventoryDataArray.length; index++) {
					await this.inventoryModel.create({ ...inventoryDataArray[index] })
				}
			} catch (error) {
				console.error(error);
			}
		} catch (error) {
			console.log('GRPC METHOD', error);
		}
	}
}
