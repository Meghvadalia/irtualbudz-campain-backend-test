import { ConflictException, Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import axios from 'axios';
import { Inventory } from '../entities/inventory.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { Product } from '../entities/product.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Store } from 'src/model/store/entities/store.entity';
import { IProduct } from '../interfaces/product.interface';
import { IInventory } from '../interfaces/inventory.interface';

@Controller('inventory')
export class InventoryController {
	constructor(
		@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
		@InjectModel(Product.name) private productModel: Model<Product>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>
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
			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({
				name: 'Monarc',
			});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: monarcCompanyData.posId,
			});

			const locations = await this.storeModel.find({
				companyId: monarcCompanyData._id,
			});

			const locationIds = locations.map(({ location }) => location.locationId);

			for (let id of locationIds) {
				const options = {
					method: 'get',
					url: `${posData.liveUrl}/v0/locations/${id}/inventory`,
					headers: {
						key: monarcCompanyData.dataObject.key,
						ClientId: monarcCompanyData.dataObject.clientId,
						Accept: 'application/json',
					},
				};
				const { data } = await axios.request(options);
				const inventoryDataArray = data.data;
				const productDataArray = inventoryDataArray.map((inventoryData: IProduct) => ({
					clientId: inventoryData.clientId,
					productName: inventoryData.productName,
					companyId: monarcCompanyData._id,
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
				}));

				const insertedProducts = await this.productModel.insertMany(productDataArray);
				const productIds = insertedProducts.map((product) => product._id);

				const inventoryDataToSaveArray = inventoryDataArray.map((inventoryData: IInventory, index) => ({
					productId: productIds[index],
					companyId: monarcCompanyData._id,
					clientId: inventoryData.clientId,
					posId: monarcCompanyData.posId,
					posProductId: inventoryData.productId,
					quantity: inventoryData.quantity,
					inventoryUnitOfMeasure: inventoryData.inventoryUnitOfMeasure,
					inventoryUnitOfMeasureToGramsMultiplier: inventoryData.inventoryUnitOfMeasureToGramsMultiplier,
					locationId: inventoryData.locationId,
					locationName: inventoryData.locationName,
					currencyCode: inventoryData.currencyCode,
					expirationDate: inventoryData.expirationDate,
					productUpdatedAt: inventoryData.productUpdatedAt,
				}));

				const insertResult = await this.inventoryModel.collection.insertMany(inventoryDataToSaveArray);

				if (insertResult.insertedCount !== inventoryDataArray.length) {
					throw new ConflictException('Duplicate records found.');
				}
			}
		} catch (error) {
			console.log('GRPC METHOD', error);
			throw new Error(error);
		}
	}
}
