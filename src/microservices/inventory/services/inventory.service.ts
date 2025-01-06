import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { dynamicCatchException } from 'src/utils/error.utils';
import { InventoryUpdatedLog } from 'src/model/inventoryUpdatedLog/entities/inventoryUpdatedLog.entity';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Injectable()
export class InventoryService {
	constructor(
		@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
		@InjectModel(Product.name) private productModel: Model<Product>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(InventoryUpdatedLog.name) private inventoryUpdateLog: Model<InventoryUpdatedLog>
	) {}

	async seedInventory(posData: IPOS, company: any): Promise<void> {
		try {
			// const locations = await this.storeModel.find({
			// 	companyId: company.companyId,
			// });
			const locations = await this.storeModel.find({
				'location.locationId': company.location.locationId,
			});

			const inventoryOptions = locations.map((location) => {
				const options = {
					method: 'get',
					url: `${posData.liveUrl}/v0/locations/${location.location.locationId}/Analytics`,
					headers: {
						key: company.key,
						ClientId: company.clientId,
						Accept: 'application/json',
					},
				};
				return { options, locationMongoId: location._id };
			});

			const inventoryResponses = await Promise.all(
				inventoryOptions.map(({ options }) => axios.request(options))
			);
			const inventoryDataArray = inventoryResponses.flatMap(({ data }) => data.data);

			const productMap = new Map();

			for (const productData of inventoryDataArray) {
				const transformedProductData = this.transformProductData(
					productData,
					company._id,
					posData._id
				);
				const savedProduct = await this.productModel.findOneAndUpdate(
					{
						posProductId: productData.productId,
						companyId: company._id,
					},
					transformedProductData,
					{ upsert: true, new: true }
				);
				productMap.set(productData.productId, savedProduct._id);
			}

			const inventoryDataToSaveArray = inventoryDataArray.map((inventoryData) =>
				this.transformInventoryData(
					inventoryData,
					productMap.get(inventoryData.productId),
					company._id,
					posData._id,
					locations
				)
			);
			this.updateOrCreateInventory(inventoryDataToSaveArray);
		} catch (error) {
			console.log(error)
			console.error('GRPC METHOD');
			// dynamicCatchException(error);
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

	// async updateOrCreateInventory(inventoryDataArray) {
	// 	console.log('updateOrCreateInventory ', inventoryDataArray.length);
	// 	const bulkWriteOps = inventoryDataArray.map((inventoryData) => ({
	// 		updateOne: {
	// 			filter: {
	// 				posProductId: inventoryData.posProductId,
	// 				storeId: inventoryData.storeId,
	// 			},
	// 			update: { $set: inventoryData },
	// 			upsert: true,
	// 		},
	// 	}));
	// 	try {
	// 		await this.inventoryModel.bulkWrite(bulkWriteOps);
	// 	} catch (error) {
	// 		console.log('updateOrCreateInventory error');
	// 		console.error(error);
	// 	}
	// }
	async updateOrCreateInventory(inventoryDataArray) {
		console.log('updateOrCreateInventory =>'+ inventoryDataArray.length);
	
		const bulkWriteOps = [];
		const inventoryUpdatedLogs = [];
	
		for (const inventoryData of inventoryDataArray) {
			const existingInventory = await this.inventoryModel.findOne({
				posProductId: inventoryData.posProductId,
				storeId: inventoryData.storeId,
			});
	
			if (existingInventory && existingInventory.quantity !== inventoryData.quantity) {
				inventoryUpdatedLogs.push({
					// productId: inventoryData.productId,
					storeId: inventoryData.storeId,
					sku: inventoryData.sku,
					posProductId: inventoryData.posProductId,
					newQuantity: inventoryData.quantity,
					oldQuantity: existingInventory.quantity,
					updatedAt: new Date(),
					posProductUpdatedAt: inventoryData.productUpdatedAt
				});
			}
	
			bulkWriteOps.push({
				updateOne: {
					filter: {
						posProductId: inventoryData.posProductId,
						storeId: inventoryData.storeId,
					},
					update: { $set: inventoryData },
					upsert: true,
				},
			});
		}
	
		try {
			await this.inventoryModel.bulkWrite(bulkWriteOps);
	
			if (inventoryUpdatedLogs.length > 0) {
				await this.inventoryUpdateLog.insertMany(inventoryUpdatedLogs);
				console.log('Logged inventory updates: >'+ inventoryUpdatedLogs.length);
			}
		} catch (error) {
			console.log('updateOrCreateInventory error');
			console.error(error);
		}
	}
	

	async seedDutchieInventory(posData: IPOS, company: any) {
		console.log('seedDutchieInventory ====>');
		try {
			const tokenOptions = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${company.key}`,
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

			const { data: productsData } = await axios.request(productOptions);
			const storeData: IStore = await this.storeModel.findOne<IStore>({
				companyId: company.companyId,
			});

			const bulkProductOps = productsData.map((d) => {
				return {
					updateOne: {
						filter: { posProductId: d.productId,companyId: company.companyId },
						update: {
							$setOnInsert: {
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
								companyId: company.companyId,
								purchaseCategory: d.raregulatoryCategory,
								speciesName: d.strainType,
								'extraDetails.nutrients': '',
								'extraDetails.isMixAndMatch': null,
								'extraDetails.isStackable': null,
								'extraDetails.productUnitOfMeasure': d.defaultUnit,
								'extraDetails.cannabinoidInformation': {
									name: '',
									lowerRange: null,
									upperRange: null,
									unitOfMeasure: '',
									unitOfMeasureToGramsMultiplier: '',
								},
								'extraDetails.weightTierInformation': {
									name: '',
									gramAmount: '',
									pricePerUnitInMinorUnits: null,
								},
							},
						},
						upsert: true,
					},
				};
			});

			await this.productModel.bulkWrite(bulkProductOps);

			const { data: inventoryData } = await axios.request(inventoryOptions);
			const productIds = new Set();

			for (let index = 0; index < productsData.length; index++) {
				const element = productsData[index];
				productIds.add(element.productId.toString());
			}
			const uniqueProductIdsArray = [...productIds];

			const products = await this.productModel.find({
				posProductId: { $in: uniqueProductIdsArray },
				companyId: company.companyId,
			});
			const bulkInventoryOps = inventoryData.map((d) => {
				const product = products.find(
					(productItem) => productItem.posProductId.toString() === d.productId.toString()
				);
				return {
					updateOne: {
						filter: { posProductId: d.productId },
						update: {
							$set: {
								quantity: d.quantityAvailable,
								expirationDate: d.expirationDate,
								companyId: company.companyId,
								posId: posData._id,
								posProductId: d.productId,
								sku: d.sku,
								productUpdatedAt: d.lastModifiedDateUtc,
								storeId: storeData._id,
								locationName: storeData.location.locationName,
								productId: product._id,
								'extraDetails.inventoryUnitOfMeasure': d.unitWeightUnit,
								'extraDetails.inventoryUnitOfMeasureToGramsMultiplier': 1,
								currencyCode: '',
								costInMinorUnits: 0,
								priceInMinorUnits: 0,
								forSale: true,
							},
						},
						upsert: true,
					},
				};
			});

			await this.inventoryModel.bulkWrite(bulkInventoryOps);

			console.log(`Seeded ${inventoryData.length} inventory data.`);
			console.log(`Seeded ${productsData.length} products.`);
		} catch (error) {
			console.error('Failed to seed inventory data:');
			console.error(error.message);
			dynamicCatchException(error);
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
				productUnitOfMeasureToGramsMultiplier: productData.productUnitOfMeasureToGramsMultiplier,
			},
		};
	}

	transformInventoryData(inventoryData, product, companyId, posId, locations): IInventory {
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
			await this.inventoryModel.deleteMany({ _id: { $in: deleteIds } }).exec();
		}
	}

	async getTotalAverageSellQuantity(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		try {
			const pipeline = [
				{
					$facet: {
						// Fetch first day's total inventory from the "inventory" collection
						firstDayInventory: [
							{
								$match: {
									storeId: storeId,
									productUpdatedAt: {
										$gte: fromDate,
										$lte: toDate,
									},
								},
							},
							{
								$group: {
									_id: null,
									totalFirstDayQuantity: { $sum: '$quantity' },
								},
							},
							{ $project: { _id: 0, totalFirstDayQuantity: 1 } },
						],

						// Fetch total new inventory from "inventoryUpdatedLog" collection
						totalNewInventory: [
							{
								$lookup: {
									from: DATABASE_COLLECTION.INVENTORYUPDATEDLOG,
									pipeline: [
										{
											$match: {
												storeId: storeId,
												posProductUpdatedAt: {
													$gte: fromDate,
													$lte: toDate,
												},
											},
										},
										{
											$group: {
												_id: null,
												totalNewInventory: { $sum: '$newQuantity' },
											},
										},
									],
									as: 'newInventoryData',
								},
							},
							{
								$project: {
									totalNewInventory: {
										$arrayElemAt: ['$newInventoryData.totalNewInventory', 0],
									},
								},
							},
						],

						// Fetch total sell quantity from "orders" and "cart" collections
						totalSellQuantity: [
							{
								$lookup: {
									from: DATABASE_COLLECTION.ORDER,
									pipeline: [
										// Stage 1: Match orders based on storeId and date range
										{
											$match: {
												storeId: storeId,
												posCreatedAt: {
													$gte: fromDate,
													$lte: toDate,
												},
											},
										},
										// Stage 2: Extract unique cart IDs from the orders
										{
											$unwind: '$itemsInCart',
										},
										{
											$group: {
												_id: null,
												cartIds: { $addToSet: '$itemsInCart' },
											},
										},
										// Stage 3: Fetch cart documents using the extracted IDs
										{
											$lookup: {
												from: DATABASE_COLLECTION.CART,
												localField: 'cartIds',
												foreignField: '_id',
												as: 'cartDocuments',
											},
										},
										// Stage 4: Unwind cartDocuments array
										{
											$unwind: '$cartDocuments',
										},
										// Stage 5: Group and calculate the total quantity
										{
											$group: {
												_id: null,
												totalSellQuantity: { $sum: '$cartDocuments.quantity' },
											},
										},
									],
									as: 'sellQuantityData',
								},
							},
							{
								$project: {
									totalSellQuantity: {
										$arrayElemAt: ['$sellQuantityData.totalSellQuantity', 0],
									},
								},
							},
						],
					},
				},
				{
					$project: {
						totalFirstDayQuantity: {
							$arrayElemAt: ['$firstDayInventory.totalFirstDayQuantity', 0],
						},
						totalNewInventory: {
							$arrayElemAt: ['$totalNewInventory.totalNewInventory', 0],
						},
						totalSellQuantity: {
							$arrayElemAt: ['$totalSellQuantity.totalSellQuantity', 0],
						},
					},
				},
				{
					$addFields: {
						// totalInventory: {
						// 	$add: [
						// 		{ $ifNull: ['$totalFirstDayQuantity', 0] },
						// 		{ $ifNull: ['$totalNewInventory', 0] },
						// 	],
						// },
						sellPercentage: {
							$cond: {
								if: {
									$eq: [
										{
											$add: [
												{ $ifNull: ['$totalFirstDayQuantity', 0] },
												{ $ifNull: ['$totalNewInventory', 0] },
											],
										},
										0,
									],
								},
								then: 0, // Return 0 if the denominator is 0
								else: {
									$round: [
										{
											$multiply: [
												{
													$divide: [
														{ $ifNull: ['$totalSellQuantity', 0] },
														{
															$add: [
																{ $ifNull: ['$totalFirstDayQuantity', 0] },
																{ $ifNull: ['$totalNewInventory', 0] },
															],
														},
													],
												},
												100,
											],
										},
										2, // Round to 2 decimal places
									],
								},
							},
						},
					},
				},
			];

			const result = await this.inventoryModel.aggregate(pipeline);
			return result.length && result[0]?.sellPercentage ? result[0]?.sellPercentage : 0;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error);
		}
	}
}
