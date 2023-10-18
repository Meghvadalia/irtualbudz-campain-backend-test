import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Inventory } from 'src/microservices/inventory';
import { Order } from 'src/microservices/order/entities/order.entity';
import { Suggestions } from 'src/model/suggestions/entities/suggestions.entity';
import { ISuggestions } from 'src/model/suggestions/interfaces/suggestions.interface';
import { updatePipeline } from 'src/utils/pipelineUpdator';
import { Suggestions as suggestionsList } from 'src/model/suggestions/interfaces/suggestions.interface';
import { RpcException } from '@nestjs/microservices';
import * as _ from 'lodash';
import { AudienceName, DATABASE_COLLECTION } from 'src/common/constants';
import { ClientStoreService } from './client.store.service';
import { getStoreTimezoneDateRange } from 'src/utils/time.utils';
import { dynamicCatchException } from 'src/utils/error.utils';
import { AudienceDetailsService } from './client.audienceDetail.service';
import { AudienceCustomer } from '../entities/audienceCustomers.entity';

@Injectable()
export class ClientSuggestionService {
	constructor(
		@InjectModel(Suggestions.name) private readonly suggestionModel: Model<Suggestions>,
		@InjectModel(Order.name) private readonly orderModel: Model<Order>,
		@InjectModel(Inventory.name) private readonly inventoryModel: Model<Inventory>,
		@InjectModel(AudienceCustomer.name) private readonly audienceCustomerModel: Model<AudienceCustomer>,
		private readonly storeService: ClientStoreService,
		private readonly audienceDetailsService: AudienceDetailsService
	) {}

	private collectionMap: Record<string, Model<any>> = {
		inventories: this.inventoryModel,
		orders: this.orderModel,
		audienceCustomers: this.audienceCustomerModel,
	};

	async suggestionList() {
		try {
			return await this.suggestionModel.find({ isActive: true, isDeleted: false, display: true }).select(['name']);
		} catch (error) {
			console.error(error);
			dynamicCatchException(error);
		}
	}

	async suggestion(storeId: string, id: string, page: number, limit: number, filter: string, text: string) {
		try {
			const suggestion = await this.suggestionModel.findOne<ISuggestions>({
				_id: new mongoose.Types.ObjectId(id),
				isActive: true,
				isDeleted: false,
			});

			if (!suggestion) {
				throw new RpcException('No Suggestion found');
			}

			const currentDate = new Date();

			const fromDateOffset = suggestion.dateOffset < 0 ? suggestion.dateOffset : 0;
			const toDateOffset = suggestion.dateOffset > 0 ? suggestion.dateOffset : 0;

			const fromDate = new Date(currentDate.getTime() + fromDateOffset * 24 * 60 * 60 * 1000);
			const toDate = new Date(currentDate.getTime() + toDateOffset * 24 * 60 * 60 * 1000);

			const storeObjectId = new mongoose.Types.ObjectId(storeId);
			const { timeZone } = await this.storeService.storeById(storeId);

			let audienceId = '';

			const storeDateTime = getStoreTimezoneDateRange(fromDate.toLocaleString(), toDate.toLocaleString(), timeZone);
			let replacements = [
				{ key: 'storeId', value: storeObjectId },
				{ key: '$gte', value: storeDateTime.formattedFromDate },
				{ key: '$lte', value: storeDateTime.formattedToDate },
				{ key: '$skip', value: page && limit ? +((page - 1) * limit) : 0 },
				{ key: '$limit', value: limit ? +limit : 10 },
			];

			let pipeline: any[] = [];

			if (suggestion.collectionName in this.collectionMap) {
				if (suggestion.name === suggestionsList.EXPIRING_PRODUCTS) {
					let suggestionData;

					switch (filter) {
						case 'sellable':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.EXPIRING_PRODUCTS });
							pipeline = _.cloneDeep(suggestionData.condition);

							const matchCondition = { forSale: true };
							if (text) {
								matchCondition['productData.productName'] = { $regex: text, $options: 'i' };
							}

							const updatedPipeline = {
								$match: matchCondition,
							};

							const indexToInsert = pipeline.findIndex((stage) => stage.$unwind);
							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
							}
							break;

						case 'brand':
						case 'category':
							suggestionData = await this.suggestionModel.findOne({ name: `Expiring Products with unique ${filter}` });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$group);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						default:
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.EXPIRING_PRODUCTS });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { 'productData.productName': { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$unwind);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
					}
				} else if (suggestion.name === suggestionsList.SLOW_MOVING_ITEMS) {
					let suggestionData;

					switch (filter) {
						case 'sellable':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.SLOW_MOVING_ITEMS });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$group'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						case 'brand':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.SLOW_MOVING_ITEMS_UNIQUE_BRAND });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$group'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						case 'category':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.SLOW_MOVING_ITEMS_UNIQUE_CATEGORY });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$group'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						default:
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.SLOW_MOVING_ITEMS });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { 'productInfo.productName': { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$unwind'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
					}
				} else if (suggestion.name === suggestionsList.NEW_INVENTORY_ITEM) {
					let suggestionData;

					switch (filter) {
						case 'sellable':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.NEW_INVENTORY_ITEM });
							pipeline = _.cloneDeep(suggestionData.condition);

							const matchCondition = { forSale: true };
							if (text) {
								matchCondition['productData.productName'] = { $regex: text, $options: 'i' };
							}

							const updatedPipeline = {
								$match: matchCondition,
							};

							const indexToInsert = pipeline.findIndex((stage) => stage.$unwind);
							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
							}
							break;

						case 'brand':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.NEW_INVENTORY_ITEMS_UNIQUE_BRAND });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$group);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						case 'category':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.New_INVENTORY_ITEMS_UNIQUE_CATEGORY });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$group);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						default:
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.NEW_INVENTORY_ITEM });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { 'productData.productName': { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$unwind);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
					}
				} else if (suggestion.name === suggestionsList.EXCESS_INVENTORY) {
					let suggestionData;

					switch (filter) {
						case 'sellable':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.EXCESS_INVENTORY });
							pipeline = _.cloneDeep(suggestionData.condition);

							const matchCondition = { sellable: true };
							if (text) {
								matchCondition['product.productName'] = { $regex: text, $options: 'i' };
							}

							const updatedPipeline = {
								$match: matchCondition,
							};

							const indexToInsert = pipeline.findIndex((stage) => stage.$unwind);
							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
							}
							break;

						case 'brand':
						case 'category':
							suggestionData = await this.suggestionModel.findOne({ name: `Excess Inventory with unique ${filter}` });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$group'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						default:
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.EXCESS_INVENTORY });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { 'product.productName': { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$match'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
					}
				} else if (suggestion.name === suggestionsList.HIGHEST_PROFITABLE_ITEMS) {
					let suggestionData;

					switch (filter) {
						case 'sellable':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.HIGHEST_PROFITABLE_ITEMS });
							pipeline = _.cloneDeep(suggestionData.condition);

							const matchCondition = { forSale: true };
							if (text) {
								matchCondition['product.productName'] = { $regex: text, $options: 'i' };
							}

							const updatedPipeline = {
								$match: matchCondition,
							};

							const indexToInsert = pipeline.findIndex((stage) => stage.$unwind);
							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
							}
							break;

						case 'brand':
						case 'category':
							suggestionData = await this.suggestionModel.findOne({ name: `Highest profitable Items with unique ${filter}` });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$group);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						default:
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.HIGHEST_PROFITABLE_ITEMS });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { name: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$limit);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
					}
				} else if (
					suggestion.name === suggestionsList.BIG_SPENDER_TOP_5_MARGINS ||
					suggestion.name === suggestionsList.FREQUENT_FLYER_TOP_5_MARGINS ||
					suggestion.name === suggestionsList.GEN_X_TOP_5_MARGINS ||
					suggestion.name === suggestionsList.GEN_Z_TOP_5_MARGINS
				) {
					let suggestionData;

					suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.TOP_5_MARGINS });
					pipeline = _.cloneDeep(suggestionData.condition);

					if (suggestion.name === suggestionsList.BIG_SPENDER_TOP_5_MARGINS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.BIG_SPENDER);
						audienceId = audienceDetails._id;
					} else if (suggestion.name === suggestionsList.FREQUENT_FLYER_TOP_5_MARGINS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.FREQUENT_FLYER);
						audienceId = audienceDetails._id;
					} else if (suggestion.name === suggestionsList.GEN_X_TOP_5_MARGINS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.GENERATION_X);
						audienceId = audienceDetails._id;
					} else if (suggestion.name === suggestionsList.GEN_Z_TOP_5_MARGINS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.GENERATION_Z);
						audienceId = audienceDetails._id;
					}

					switch (filter) {
						case 'sellable':
							const matchCondition = { 'inventoryData.forSale': true };
							if (text) {
								matchCondition['cartItems.productName'] = { $regex: text, $options: 'i' };
							}

							const updatedPipeline = {
								$match: matchCondition,
							};

							let indexToInsert = -1;
							for (let i = pipeline.length - 1; i >= 0; i--) {
								if (pipeline[i]['$unwind'] !== undefined) {
									indexToInsert = i;
									break;
								}
							}

							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
							}
							break;

						case 'brand':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.TOP_5_MARGINS_UNIQUE_BRAND });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$group'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
						case 'category':
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.TOP_5_MARGINS_UNIQUE_CATEGORY });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { _id: { $regex: text, $options: 'i' } },
								};

								let indexToInsert = -1;
								for (let i = pipeline.length - 1; i >= 0; i--) {
									if (pipeline[i]['$group'] !== undefined) {
										indexToInsert = i;
										break;
									}
								}

								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						default:
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.TOP_5_MARGINS });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { name: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$limit);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
					}
					replacements.push({ key: 'audienceId', value: new Types.ObjectId(audienceId) });
				} else if (
					suggestion.name === suggestionsList.FREQUENT_FLYER_SLOW_MOVING_ITEMS ||
					suggestion.name === suggestionsList.BIG_SPENDER_SLOW_MOVING_ITEMS ||
					suggestion.name === suggestionsList.GEN_X_SLOW_MOVING_ITEMS ||
					suggestion.name === suggestionsList.GEN_Z_SLOW_MOVING_ITEMS
				) {
					let suggestionData;

					suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.SLOW_MOVING_ITEMS_NEW });
					pipeline = _.cloneDeep(suggestionData.condition);

					if (suggestion.name === suggestionsList.BIG_SPENDER_SLOW_MOVING_ITEMS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.BIG_SPENDER);
						audienceId = audienceDetails._id;
					} else if (suggestion.name === suggestionsList.FREQUENT_FLYER_SLOW_MOVING_ITEMS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.FREQUENT_FLYER);
						audienceId = audienceDetails._id;
					} else if (suggestion.name === suggestionsList.GEN_X_SLOW_MOVING_ITEMS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.GENERATION_X);
						audienceId = audienceDetails._id;
					} else if (suggestion.name === suggestionsList.GEN_Z_SLOW_MOVING_ITEMS) {
						const audienceDetails = await this.audienceDetailsService.getAudienceIdByName(AudienceName.GENERATION_Z);
						audienceId = audienceDetails._id;
					}

					switch (filter) {
						case 'sellable':
							const matchCondition = { 'inventoryData.forSale': true };
							if (text) {
								matchCondition['cartData.productName'] = { $regex: text, $options: 'i' };
							}

							const updatedPipeline = {
								$match: matchCondition,
							};

							let indexToInsert = -1;
							for (let i = pipeline.length - 1; i >= 0; i--) {
								if (pipeline[i]['$unwind'] !== undefined) {
									indexToInsert = i;
									break;
								}
							}

							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
							}
							break;

						case 'brand':
							suggestionData = await this.suggestionModel.findOne({
								name: suggestionsList.SLOW_MOVING_ITEMS_WITH_UNIQUE_BRAND_NEW,
							});
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { name: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$project);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;
						case 'category':
							suggestionData = await this.suggestionModel.findOne({
								name: suggestionsList.SLOW_MOVING_ITEMS_WITH_UNIQUE_CATEGORY_NEW,
							});
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { name: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$project);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
							}
							break;

						default:
							suggestionData = await this.suggestionModel.findOne({ name: suggestionsList.SLOW_MOVING_ITEMS_NEW });
							pipeline = _.cloneDeep(suggestionData.condition);

							if (text) {
								const updatedPipeline = {
									$match: { name: { $regex: text, $options: 'i' } },
								};

								const indexToInsert = pipeline.findIndex((stage) => stage.$limit);
								if (indexToInsert !== -1) {
									pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
								}
								break;
							}
					}
					replacements.push({ key: 'audienceId', value: new Types.ObjectId(audienceId) });
				}
			} else {
				suggestion.collectionName = DATABASE_COLLECTION.INVENTORY;
				pipeline = [
					{
						$match: {
							storeId: storeObjectId,
						},
					},
					{
						$lookup: {
							from: DATABASE_COLLECTION.PRODUCT,
							localField: 'productId',
							foreignField: '_id',
							as: 'products',
						},
					},
					{
						$unwind: {
							path: '$products',
						},
					},
					{
						$project: {
							_id: '$products._id',
							name: '$products.productName',
							brand: '$products.brand',
							category: '$products.category',
						},
					},
					{
						$sort: {
							name: 1,
						},
					},
					{
						$skip: '',
					},
					{
						$limit: '',
					},
				];
				switch (filter) {
					case 'brand':
					case 'category':
						if (text) {
							const updatedPipeline = [
								{
									$group: {
										_id: 0,
										name: {
											$addToSet: `$${filter}`,
										},
									},
								},
								{
									$unwind: { path: '$name' },
								},
								{
									$match: {
										$and: [
											{
												name: {
													$ne: null,
												},
											},
											{
												name: {
													$regex: text,
													$options: 'i',
												},
											},
										],
									},
								},
								{
									$project: {
										_id: 0,
									},
								},
							];
							const indexToInsert = pipeline.findIndex((stage) => stage.$project);
							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, ...updatedPipeline);
							}
						} else {
							const updatedPipeline = [
								{
									$group: {
										_id: 0,
										name: {
											$addToSet: `$${filter}`,
										},
									},
								},
								{
									$unwind: '$name',
								},
								{
									$match: {
										name: {
											$ne: null,
										},
									},
								},
								{
									$project: {
										_id: 0,
									},
								},
							];
							const indexToInsert = pipeline.findIndex((stage) => stage.$project);
							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, ...updatedPipeline);
							}
						}
						break;
					default:
						if (text) {
							const updatedPipeline = {
								$match: {
									name: {
										$regex: text,
										$options: 'i',
									},
								},
							};
							const indexToInsert = pipeline.findIndex((stage) => stage.$project);
							if (indexToInsert !== -1) {
								pipeline.splice(indexToInsert + 1, 0, updatedPipeline);
							}
						}
						break;
				}
			}
			for (const element of replacements) {
				updatePipeline(pipeline, element.key, element.value);
			}
			const productList = await this.collectionMap[suggestion.collectionName].aggregate(pipeline);
			return productList;
		} catch (error) {
			console.trace(error);
			dynamicCatchException(error);
		}
	}
}
