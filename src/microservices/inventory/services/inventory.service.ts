import { Injectable } from '@nestjs/common';
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

	async seedInventory(posName: string): Promise<void> {
		try {
			const posData = await this.posModel.findOne({ name: posName });
			const flowhubCompaniesList = await this.companyModel.find<ICompany>(
				{
					isActive: true,
					posId: posData._id,
				}
			);

			for (const company of flowhubCompaniesList) {
				const locations = await this.storeModel.find({
					companyId: company._id,
				});

				const inventoryOptions = locations.map((location) => {
					const options = {
						method: 'get',
						url: `${posData.liveUrl}/v0/locations/${location.location.locationId}/Analytics`,
						headers: {
							key: company.dataObject.key,
							ClientId: company.dataObject.clientId,
							Accept: 'application/json',
						},
					};
					return { options, locationMongoId: location._id };
				});

				const inventoryResponses = await Promise.all(
					inventoryOptions.map(({ options }) =>
						axios.request(options)
					)
				);
				const inventoryDataArray = inventoryResponses.flatMap(
					({ data }) => data.data
				);

				const productMap = new Map();

				for (const productData of inventoryDataArray) {
					const transformedProductData = this.transformProductData(
						productData,
						company._id,
						posData._id
					);
					const savedProduct = await this.productModel.create(
						transformedProductData
					);
					productMap.set(productData.productId, savedProduct._id);
				}

				const inventoryDataToSaveArray = inventoryDataArray.map(
					(inventoryData) =>
						this.transformInventoryData(
							inventoryData,
							productMap.get(inventoryData.productId),
							company._id,
							posData._id,
							locations
						)
				);

				await this.updateOrCreateInventory(inventoryDataToSaveArray);
			}
		} catch (error) {
			console.log('GRPC METHOD', error);
			throw error;
		}
	}

	async updateOrCreateProducts(products) {
		const bulkWriteOps = products.map((product) => ({
			updateOne: {
				filter: {
					posProductId: product.posProductId,
					companyId: product.companyId,
				},
				update: { $set: product },
				upsert: true,
			},
		}));

		await this.productModel.bulkWrite(bulkWriteOps);
	}

	async updateOrCreateInventory(inventoryDataArray) {
		const bulkWriteOps = inventoryDataArray.map((inventoryData) => ({
			updateOne: {
				filter: {
					posProductId: inventoryData.posProductId,
					companyId: inventoryDataArray.companyId,
				},
				update: { $set: inventoryData },
				upsert: true,
			},
		}));

		await this.inventoryModel.bulkWrite(bulkWriteOps);
	}

	async seedDutchieInventory(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne<IPOS>({
				name: posName,
			});

			const companyData = await this.companyModel.find<ICompany>({
				posId: posData._id,
				isActive: true,
			});

			for (const company of companyData) {
				const tokenOptions = {
					method: 'get',
					url: `${posData.liveUrl}/util/AuthorizationHeader/${company.dataObject.key}`,
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
					url: `${posData.liveUrl}/reporting/products`,
					headers: {
						Accept: 'application/json',
						Authorization: token,
					},
				};

				const { data: productsData } = await axios.request(
					productOptions
				);
				const storeData: IStore = await this.storeModel.findOne<IStore>(
					{
						companyId: company._id,
					}
				);

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
						posId: posData._id,
						type: d.category,
						companyId: company._id,
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
				const insertedProducts = await this.productModel.insertMany(
					productArray
				);

				const { data: inventoryData } = await axios.request(
					inventoryOptions
				);

				const inventoryArray: IInventory[] = [];

				for (const d of inventoryData) {
					const matchingProduct = insertedProducts.find((product) => {
						return +product.posProductId === +d.productId;
					});

					inventoryArray.push({
						quantity: d.quantityAvailable,
						expirationDate: d.expirationDate,
						companyId: company._id,
						posId: posData._id,
						posProductId: d.productId,
						productUpdatedAt: d.lastModifiedDateUtc,
						storeId: storeData._id,
						sku: d.sku,
						locationName: storeData.location.locationName,
						productId: matchingProduct
							? (matchingProduct._id as string)
							: '',
						extraDetails: {
							inventoryUnitOfMeasure: d.unitWeightUnit,
							inventoryUnitOfMeasureToGramsMultiplier: 1,
							currencyCode: '',
						},
						costInMinorUnits: 0,
						priceInMinorUnits: 0,
						forSale: false,
					});
				}

				await this.inventoryModel.insertMany(inventoryArray);
				console.log(`Seeded ${inventoryData.length} inventory data.`);
				console.log(`Seeded ${productsData.length} products.`);
			}
		} catch (error) {
			console.error('Failed to seed inventory data:', error.message);
			throw error;
		}
	}

	transformProductData(productData, companyId, posId) {
		return {
			productName: productData.productName,
			companyId,
			posId,
			posProductId: productData.productId,
			productDescription: productData.productDescription,
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
				productUnitOfMeasureToGramsMultiplier:
					productData.productUnitOfMeasureToGramsMultiplier,
			},
		};
	}

	transformInventoryData(
		inventoryData,
		product,
		companyId,
		posId,
		locations
	): IInventory {
		const location = locations.find(
			({ location }) => location.locationId === inventoryData.locationId
		);
		return {
			productId: product._id,
			companyId,
			posProductId: inventoryData.productId,
			posId,
			quantity: inventoryData.quantity,
			sku: inventoryData.sku,
			storeId: location ? location._id : undefined,
			locationName: inventoryData.locationName,
			expirationDate: inventoryData.expirationDate,
			productUpdatedAt: inventoryData.productUpdatedAt,
			extraDetails: {
				inventoryUnitOfMeasure: inventoryData.inventoryUnitOfMeasure,
				inventoryUnitOfMeasureToGramsMultiplier:
					inventoryData.inventoryUnitOfMeasureToGramsMultiplier,
				currencyCode: inventoryData.currencyCode,
			},
			costInMinorUnits: inventoryData.costInMinorUnits,
			priceInMinorUnits: inventoryData.priceInMinorUnits,
			forSale: inventoryData.forSale,
		};
	}

	async migrateData() {
		const products = await this.productModel.find();

		for (const product of products) {
			const inventoryItem = await this.inventoryModel.findOne({
				posProductId: product.posProductId,
			});

			if (inventoryItem) {
				await this.inventoryModel
					.findByIdAndUpdate(inventoryItem._id, {
						productId: product._id,
					})
					.exec();
			}
		}

		const duplicateInventoryItems = await this.inventoryModel.aggregate([
			{
				$group: {
					_id: '$posProductId',
					count: { $sum: 1 },
					ids: { $push: '$_id' },
				},
			},
			{
				$match: {
					count: { $gt: 1 },
				},
			},
		]);

		for (const duplicate of duplicateInventoryItems) {
			const [keepId, ...deleteIds] = duplicate.ids;
			await this.inventoryModel
				.deleteMany({ _id: { $in: deleteIds } })
				.exec();
		}
	}
}
