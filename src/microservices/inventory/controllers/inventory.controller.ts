import { Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import axios from 'axios';
import { Inventory } from '../entities/inventory.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { Product } from '../entities/product.entity';

@Controller('inventory')
export class InventoryController {
	constructor(
		@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
		@InjectModel(Product.name) private productModel: Model<Product>
	) {}

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
	@Get('seed')
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
				for (let index = 0; index < inventoryDataArray.length; index++) {
					const inventoryData = inventoryDataArray[index];

					const productData = {
						clientId: inventoryData.clientId,
						productName: inventoryData.productName,
						productDescription: inventoryData.productDescription,
						priceInMinorUnits: inventoryData.priceInMinorUnits,
						sku: inventoryData.sku,
						nutrients: inventoryData.nutrients,
						productPictureURL: inventoryData.productPictureURL,
						purchaseCategory: inventoryData.purchaseCategory,
						category: inventoryData.category,
						type: inventoryData.type,
						brand: inventoryData.brand,
						isMixAndMatch: inventoryData.isMixAndMatch,
						isStackable: inventoryData.isStackable,
						productUnitOfMeasure: inventoryData.productUnitOfMeasure,
						productUnitOfMeasureToGramsMultiplier: inventoryData.productUnitOfMeasureToGramsMultiplier,
						productWeight: inventoryData.productWeight,
						weightTierInformation: inventoryData.weightTierInformation,
						cannabinoidInformation: inventoryData.cannabinoidInformation,
						speciesName: inventoryData.speciesName,
					};

					const product = await this.productModel.create(productData);

					const inventoryDataToSave = {
						productId: product._id,
						clientId: inventoryData.clientId,
						posProductId: inventoryData.productId,
						quantity: inventoryData.quantity,
						inventoryUnitOfMeasure: inventoryData.inventoryUnitOfMeasure,
						inventoryUnitOfMeasureToGramsMultiplier: inventoryData.inventoryUnitOfMeasureToGramsMultiplier,
						locationId: inventoryData.locationId,
						locationName: inventoryData.locationName,
						currencyCode: inventoryData.currencyCode,
						expirationDate: inventoryData.expirationDate,
						productUpdatedAt: inventoryData.productUpdatedAt,
					};
					await this.inventoryModel.create(inventoryDataToSave);
				}
			} catch (error) {
				console.error(error);
			}
		} catch (error) {
			console.log('GRPC METHOD', error);
		}
	}
}
