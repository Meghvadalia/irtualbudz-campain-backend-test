import { ConflictException, Get, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Store } from 'src/model/store/entities/store.entity';
import { Inventory } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import axios, { AxiosRequestConfig } from 'axios';
import { IInventory } from '../interfaces/inventory.interface';
import { IProduct } from '../interfaces/product.interface';
import { IStore } from 'src/model/store/interface/store.inteface';

@Injectable()
export class InventoryService {
	constructor(
		@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
		@InjectModel(Product.name) private productModel: Model<Product>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>
	) {}

	async seedInventory(posName:string): Promise<void> {
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

			const locationIds = locations.map((location) => ({
				locationId: location.location.locationId,
				locationMongoId: location._id,
			}));

			const inventoryOptions = locationIds.map((location) => {
				const { locationId, locationMongoId } = location;

				const options = {
					method: 'get',
					url: `${liveUrl}/v0/locations/${locationId}/inventory`,
					headers: {
						key: dataObject.key,
						ClientId: dataObject.clientId,
						Accept: 'application/json',
					},
				};
				return { options, locationMongoId };
			});

			const inventoryResponses = await Promise.all(inventoryOptions.map(({ options }) => axios.request(options)));
			const inventoryDataArray = inventoryResponses.flatMap(({ data }) => data.data);

			const productDataArray: IProduct[] = inventoryDataArray.map((productData) => ({
				productName: productData.productName,
				companyId: _id,
				posId,
				posProductId: productData.productId,
				productDescription: productData.productDescription,
				priceInMinorUnits: productData.priceInMinorUnits,
				sku: productData.sku,
				productPictureURL: productData.productPictureURL,
				purchaseCategory: productData.purchaseCategory,
				category: productData.category,
				type: productData.type,
				brand: productData.brand,
				productWeight: productData.productWeight,
				speciesName: productData.speciesName,
				extraDetails: {
					isMixAndMatch: productData.isMixAndMatch,
					isStackable: productData.isStackable,
					nutrients: productData.nutrients,
					weightTierInformation: productData.weightTierInformation,
					cannabinoidInformation: productData.cannabinoidInformation,
					productUnitOfMeasure: productData.productUnitOfMeasure,
					productUnitOfMeasureToGramsMultiplier: productData.productUnitOfMeasureToGramsMultiplier,
				},
			}));

			const insertedProducts = await this.productModel.insertMany(productDataArray);
			const productIds = insertedProducts.map((product) => product._id);

			const inventoryDataToSaveArray: IInventory[] = inventoryDataArray.map((inventoryData, index: number) => {
				const location = locations.find(({ location }) => location.locationId === inventoryData.locationId);
				return {
					productId: productIds[index] as string,
					companyId: _id,
					posProductId: inventoryData.productId,
					posId,
					quantity: inventoryData.quantity,
					locationId: location?._id as string,
					locationName: inventoryData.locationName,
					expirationDate: inventoryData.expirationDate,
					productUpdatedAt: inventoryData.productUpdatedAt,
					extraDetails: {
						inventoryUnitOfMeasure: inventoryData.inventoryUnitOfMeasure,
						inventoryUnitOfMeasureToGramsMultiplier: inventoryData.inventoryUnitOfMeasureToGramsMultiplier,
						currencyCode: inventoryData.currencyCode,
					},
				};
			});

			const insertResult = await this.inventoryModel.collection.insertMany(inventoryDataToSaveArray);

			if (insertResult.insertedCount !== inventoryDataArray.length) {
				throw new ConflictException('Duplicate records found.');
			}
		} catch (error) {
			console.log('GRPC METHOD', error);
			throw error;
		}
	}

	async seedDutchieInventory() {
		try {
			const {
				posId,
				dataObject,
				_id: companyId,
			}: ICompany = await this.companyModel.findOne<ICompany>({
				name: 'Virtual Budz',
			});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: posId,
			});

			const storeData: IStore = await this.storeModel.findOne<IStore>({
				companyId,
			});

			const tokenOptions = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${dataObject.key}`,
				headers: {
					Accept: 'application/json',
				},
			};

			const { data: token } = await axios.request(tokenOptions);

			const inventoryOptions: AxiosRequestConfig = {
				url: `${posData.liveUrl}/inventory?includeLabResults=true&includeRoomQuantities=true`,
				headers: {
					Accept: 'application/json',
					Authorization: token,
				},
			};

			const productOptions: AxiosRequestConfig = {
				url: `${posData.liveUrl}/products`,
				headers: {
					Accept: 'application/json',
					Authorization: token,
				},
			};

			const { data: productsData } = await axios.request(productOptions);

			const productArray: IProduct[] = [];

			for (const d of productsData) {
				productArray.push({
					productName: d.productName,
					productDescription: d.description,
					brand: d.brandName,
					category: d.masterCategory,
					posProductId: d.productId,
					productPictureURL: d.imageUrl,
					productWeight: d.netWeight,
					sku: d.sku,
					posId,
					type: d.category,
					companyId,
					priceInMinorUnits: d.price * 100,
					purchaseCategory: d.raregulatoryCategory,
					speciesName: d.strainType,
					extraDetails: {
						nutrients: '',
						isMixAndMatch: null,
						isStackable: null,
						productUnitOfMeasure: d.defaultUnit,
						productUnitOfMeasureToGramsMultiplier: '',
						cannabinoidInformation: {
							name: '',
							lowerRange: null,
							upperRange: null,
							unitOfMeasure: '',
							unitOfMeasureToGramsMultiplier: '',
						},
						weightTierInformation: {
							name: '',
							gramAmount: '',
							pricePerUnitInMinorUnits: null,
						},
					},
				});
			}
			const insertedProducts = await this.productModel.insertMany(productArray);

			const { data: inventoryData } = await axios.request(inventoryOptions);

			const inventoryArray: IInventory[] = [];

			for (const d of inventoryData) {
				const matchingProduct = insertedProducts.find((product) => {
					return +product.posProductId === +d.productId;
				});

				inventoryArray.push({
					quantity: d.quantityAvailable,
					expirationDate: d.expirationDate,
					companyId,
					posId,
					posProductId: d.productId,
					productUpdatedAt: d.lastModifiedDateUtc,
					locationId: storeData._id,
					locationName: storeData.location.locationName,
					productId: matchingProduct ? (matchingProduct._id as string) : '',
					extraDetails: {
						inventoryUnitOfMeasure: d.unitWeightUnit,
						inventoryUnitOfMeasureToGramsMultiplier: 1,
						currencyCode: '',
					},
				});
			}

			await this.inventoryModel.insertMany(inventoryArray);
			console.log(`Seeded ${inventoryData.length} inventory data.`);
			console.log(`Seeded ${productsData.length} products.`);
		} catch (error) {
			console.error('Failed to seed inventory data:', error.message);
			throw error;
		}
	}
}
