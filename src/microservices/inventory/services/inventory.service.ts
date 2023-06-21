import { ConflictException, Get, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Store } from 'src/model/store/entities/store.entity';
import { Inventory } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';
import { Cron } from '@nestjs/schedule';
import { ICompany } from 'src/model/company/interface/company.interface';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import axios from 'axios';
import { IInventory } from '../interfaces/inventory.interface';

@Injectable()
export class InventoryService {
	constructor(
		@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
		@InjectModel(Product.name) private productModel: Model<Product>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>
	) {}

	@Cron('0 0 0 * * *')
	async seedInventory(): Promise<void> {
		try {
			const { posId, dataObject, _id } = await this.companyModel.findOne<ICompany>({
				name: 'Monarc',
			});

			const { liveUrl } = await this.posModel.findOne<IPOS>({
				_id: posId,
			});

			const locations = await this.storeModel.find({
				companyId: _id,
			});

			const locationIds = locations.map(({ location }) => location.locationId);

			const inventoryPromises = locationIds.map((id) => {
				const options = {
					method: 'get',
					url: `${liveUrl}/v0/locations/${id}/inventory`,
					headers: {
						key: dataObject.key,
						ClientId: dataObject.clientId,
						Accept: 'application/json',
					},
				};
				return axios.request(options);
			});

			const inventoryResponses = await Promise.all(inventoryPromises);
			const inventoryDataArray = inventoryResponses.flatMap(({ data }) => data.data);

			const productDataArray = inventoryDataArray.map((productData) => ({
				clientId: productData.clientId,
				productName: productData.productName,
				companyId: _id,
				POSId: posId,
				posProductId: productData.productId,
				productDescription: productData.productDescription,
				priceInMinorUnits: productData.priceInMinorUnits,
				sku: productData.sku,
				nutrients: productData.nutrients,
				productPictureURL: productData.productPictureURL,
				purchaseCategory: productData.purchaseCategory,
				category: productData.category,
				type: productData.type,
				brand: productData.brand,
				isMixAndMatch: productData.isMixAndMatch,
				isStackable: productData.isStackable,
				productUnitOfMeasure: productData.productUnitOfMeasure,
				productUnitOfMeasureToGramsMultiplier: productData.productUnitOfMeasureToGramsMultiplier,
				productWeight: productData.productWeight,
				weightTierInformation: productData.weightTierInformation,
				cannabinoidInformation: productData.cannabinoidInformation,
				speciesName: productData.speciesName,
			}));

			const insertedProducts = await this.productModel.insertMany(productDataArray);
			const productIds = insertedProducts.map((product) => product._id);

			const inventoryDataToSaveArray = inventoryDataArray.map((inventoryData: IInventory, index: number) => ({
				productId: productIds[index],
				companyId: _id,
				clientId: inventoryData.clientId,
				POSId: posId,
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
		} catch (error) {
			console.log('GRPC METHOD', error);
			throw error;
		}
	}
}
