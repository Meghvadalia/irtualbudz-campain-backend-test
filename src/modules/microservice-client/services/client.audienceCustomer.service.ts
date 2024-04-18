import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AudienceCustomer } from '../entities/audienceCustomers.entity';
import * as dayjs from 'dayjs';
import { POS } from 'src/model/pos/entities/pos.entity';
import mongoose, { Model, PipelineStage, Types } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { Store } from 'src/model/store/entities/store.entity';
import { AudienceDetailsService } from './client.audienceDetail.service';
import { AudienceName, DATABASE_COLLECTION } from 'src/common/constants';
import { Order } from 'src/microservices/order/entities/order.entity';
import { dynamicCatchException } from 'src/utils/error.utils';
import { AudienceCustomerType, IAudienceCustomer } from '../interfaces/audienceCustomers.interface';
import { Customer } from 'src/microservices/customers';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class ClientAudienceCustomerService {
	constructor(
		@InjectModel(AudienceCustomer.name)
		private readonly audienceCustomerModel: Model<AudienceCustomer>,
		@InjectModel(POS.name) private readonly POSModel: Model<POS>,
		@InjectModel(Order.name) private readonly orderModel: Model<Order>,
		@InjectModel(Company.name) private readonly companyModel: Model<Company>,
		@InjectModel(Store.name) private readonly storeModel: Model<Store>,
		@InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
		private readonly audienceDetailsService: AudienceDetailsService
	) {}

	async seedAudiceCustomers() {
		try {
			const currentDate = new Date(dayjs(new Date()).format('YYYY-MM-DDT00:00:00.000[Z]'));
			const fromDate = new Date(
				dayjs(currentDate).subtract(15, 'day').format('YYYY-MM-DDT00:00:00.000[Z]')
			);

			const posData = await this.POSModel.find({});

			for (const pos of posData) {
				const companyData = await this.companyModel.find({
					posId: pos._id,
				});

				for (const company of companyData) {
					const storeData = await this.storeModel.find({
						companyId: company._id,
					});

					for (const store of storeData) {
						await this.bigSpenderOrValueShopper(store._id as Types.ObjectId, fromDate, currentDate);
						await this.purchaseCategoryAudience(store._id as Types.ObjectId, fromDate, currentDate);
					}
				}
			}
		} catch (error) {
			console.trace(error);
			throw error;
		}
	}

	async addTargetAudience(audienceId, campaignId: string, storeId: string) {
		try {
			const storeObjectId = new mongoose.Types.ObjectId(storeId);
			audienceId = new mongoose.Types.ObjectId(audienceId);

			const audienceDetail = await this.audienceDetailsService.getAudienceDetailById(audienceId);
			const bulkOperations = [];

			if (audienceDetail.name === AudienceName.ALL) {
				const audienceCustomersList: IAudienceCustomer[] = await this.customerModel.find({
					storeId: { $in: [storeObjectId] },
				});
				console.log('================>');
				console.log('Audience Length' + audienceCustomersList.length);
				for (const customer of audienceCustomersList) {
					const audienceCustomerData = {
						audienceId,
						campaignId,
						storeId: storeObjectId,
						customerId: customer._id,
						type: AudienceCustomerType.USER,
					};

					bulkOperations.push({
						insertOne: {
							document: audienceCustomerData,
						},
					});
				}
			} else {
				const audienceCustomersList: IAudienceCustomer[] = await this.audienceCustomerModel.find({
					audienceId,
					type: AudienceCustomerType.SYSTEM,
				});

				for (const customer of audienceCustomersList) {
					const audienceCustomerData = {
						audienceId,
						campaignId,
						storeId: storeObjectId,
						customerId: customer.customerId,
						type: AudienceCustomerType.USER,
					};

					bulkOperations.push({
						insertOne: {
							document: audienceCustomerData,
						},
					});
				}
			}
			console.log('bulkOperations ', bulkOperations.length);

			const audienceCustomer = await this.audienceCustomerModel.bulkWrite(bulkOperations, {
				ordered: false,
			});
			return audienceCustomer;
		} catch (error) {
			if (error.code === 11000) {
				console.error('Duplicate key error: ' + error.message);
			} else {
				console.error('Unexpected error occurred: ' + error.message);
				throw error;
			}
		}
	}

	async getAudienceByAudienceId(audienceId) {
		const audienceDetail = await this.audienceDetailsService.getAudienceDetailById(audienceId);
		let audienceArray = [];

		if (audienceDetail.name === AudienceName.ALL) {
			const audienceCustomersList = await this.audienceCustomerModel
				.find({
					type: AudienceCustomerType.SYSTEM,
				})
				.select(['customerId', '-_id']);
			audienceArray = audienceArray.concat(audienceCustomersList);
		} else {
			const audienceCustomersList = await this.audienceCustomerModel
				.find({
					type: AudienceCustomerType.SYSTEM,
					audienceId: new Types.ObjectId(audienceId),
				})
				.select(['customerId', '-_id']);
			audienceArray = audienceArray.concat(audienceCustomersList);
		}

		audienceArray = audienceArray.flat(1).filter((item) => item);
		return audienceArray;
	}

	async getAudienceCustomerCount(campaignId: string) {
		const audienceCount = await this.audienceCustomerModel.countDocuments({
			campaignId: new mongoose.Types.ObjectId(campaignId),
		});
		return { count: audienceCount };
	}

	async bigSpenderOrValueShopper(storeId, fromDate: Date, toDate: Date) {
		const bigSpenderAudience = await this.audienceDetailsService.getAudienceIdByName(
			AudienceName.BIG_SPENDER
		);
		const valueShopperAudience = await this.audienceDetailsService.getAudienceIdByName(
			AudienceName.VALUE_SHOPPER
		);

		const { averageCartSize } = await this.averageCartSize(storeId, fromDate, toDate);

		const pipeline: PipelineStage[] = [
			{
				$match: {
					storeId,
					posCreatedAt: {
						$gte: fromDate,
						$lt: toDate,
					},
				},
			},
			{
				$facet: {
					bigSpenders: [
						{
							$match: {
								'totals.finalTotal': { $gte: averageCartSize },
							},
						},
						{
							$group: {
								_id: '$customerId',
							},
						},
						{
							$project: {
								_id: 0,
								customerId: '$_id',
							},
						},
					],
					valueShoppers: [
						{
							$match: {
								'totals.finalTotal': { $lt: averageCartSize },
							},
						},
						{
							$group: {
								_id: '$customerId',
							},
						},
						{
							$project: {
								_id: 0,
								customerId: '$_id',
							},
						},
					],
				},
			},
			{
				$project: {
					customers: {
						bigSpenders: '$bigSpenders.customerId',
						valueShoppers: '$valueShoppers.customerId',
					},
				},
			},
		];

		const result = await this.orderModel.aggregate(pipeline);
		const { bigSpenders, valueShoppers } = result[0].customers;

		const previousCronJobCustomers = await this.audienceCustomerModel
			.find({
				storeId,
				audienceId: {
					$in: [bigSpenderAudience._id, valueShopperAudience._id],
				},
			})
			.distinct('customerId');

		if (previousCronJobCustomers.length === 0) {
			try {
				await Promise.all(
					bigSpenders.map((customerId) =>
						this.audienceCustomerModel.create({
							storeId,
							customerId,
							audienceId: bigSpenderAudience._id,
						})
					)
				);

				await Promise.all(
					valueShoppers.map((customerId) =>
						this.audienceCustomerModel.create({
							storeId,
							customerId,
							audienceId: valueShopperAudience._id,
						})
					)
				);
			} catch (error) {
				console.error('Unexpected error occurred:', error.message);
				throw error;
			}
		} else {
			await Promise.all(
				previousCronJobCustomers.map(async (customerId) => {
					try {
						const isPresentInCurrentRun =
							bigSpenders.includes(customerId) || valueShoppers.includes(customerId);
						const isBigSpenderInCurrentRun = bigSpenders.includes(customerId);
						const existingRecord = await this.audienceCustomerModel.findOne({
							storeId,
							customerId,
						});

						if (isPresentInCurrentRun) {
							if (existingRecord) {
								if (
									isBigSpenderInCurrentRun &&
									existingRecord.audienceId !== bigSpenderAudience._id
								) {
									await this.audienceCustomerModel.create({
										storeId,
										customerId,
										audienceId: valueShopperAudience._id,
									});
									await existingRecord.updateOne({
										isArchive: true,
									});
								} else if (
									!isBigSpenderInCurrentRun &&
									existingRecord.audienceId !== valueShopperAudience._id
								) {
									await this.audienceCustomerModel.create({
										storeId,
										customerId,
										audienceId: bigSpenderAudience._id,
									});
									await existingRecord.updateOne({
										isArchive: true,
									});
								}
							} else {
								const audienceId = isBigSpenderInCurrentRun
									? bigSpenderAudience._id
									: valueShopperAudience._id;
								await this.audienceCustomerModel.create({
									storeId,
									customerId,
									audienceId,
								});
							}
						} else {
							if (existingRecord) {
								await existingRecord.updateOne({ isArchive: true });
							}
						}
					} catch (error) {
						if (error.code === 11000) {
							console.error('Duplicate key error:' + error.message);
						} else {
							console.error('Unexpected error occurred:' + error.message);
							throw error;
						}
					}
				})
			);
		}
	}

	async purchaseCategoryAudience(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		const formattedFromDate = new Date(fromDate);
		const formattedToDate = new Date(toDate);

		const pipeline: PipelineStage[] = [
			{
				$match: {
					storeId,
					posCreatedAt: {
						$gte: formattedFromDate,
						$lte: formattedToDate,
					},
				},
			},
			{
				$unwind: {
					path: '$itemsInCart',
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: 'itemsInCart',
					foreignField: '_id',
					as: 'carts',
				},
			},
			{
				$unwind: {
					path: '$carts',
				},
			},
			{
				$project: {
					customerId: 1,
					purchaseCategory: '$carts.category',
				},
			},
			{
				$group: {
					_id: {
						customerId: '$customerId',
						purchaseCategory: '$purchaseCategory',
					},
				},
			},
			{
				$project: {
					_id: 0,
					customerId: '$_id.customerId',
					purchaseCategory: '$_id.purchaseCategory',
				},
			},
		];

		const result = await this.orderModel.aggregate(pipeline);
		let name = '';
		const audienceIdMap: { [key: string]: Types.ObjectId } = {};

		const uniqueCategories = [...new Set(result.map((item) => item.purchaseCategory))];
		for (const category of uniqueCategories) {
			if (category === 'Flower') {
				name = AudienceName.FLOWER_POWER;
			} else if (category === 'Edible') {
				name = AudienceName.JUST_EAT_ALL;
			} else if (category === 'Concentrate') {
				name = AudienceName.DABBA_DABBA_DO;
			}

			if (name !== '') {
				const { _id: audienceId } = await this.audienceDetailsService.getAudienceIdByName(name);
				audienceIdMap[category] = audienceId;
			}
		}

		const previousAudienceCustomers = await this.audienceCustomerModel.find({
			storeId,
			$or: [
				{ audienceId: audienceIdMap['Flower'] },
				{ audienceId: audienceIdMap['Edible'] },
				{ audienceId: audienceIdMap['Concentrate'] },
			],
		});

		const previousCustomerIds = new Set(
			previousAudienceCustomers.map((item) => item.customerId.toString())
		);

		for (const item of result) {
			const { customerId, purchaseCategory } = item;
			name = '';

			if (purchaseCategory === 'Flower') {
				name = AudienceName.FLOWER_POWER;
			} else if (purchaseCategory === 'Edible') {
				name = AudienceName.JUST_EAT_ALL;
			} else if (purchaseCategory === 'Concentrate') {
				name = AudienceName.DABBA_DABBA_DO;
			}

			if (name !== '') {
				const audienceId: any = audienceIdMap[purchaseCategory];

				try {
					await this.audienceCustomerModel.findOneAndUpdate(
						{
							customerId,
							audienceId,
							storeId,
						},
						{ $set: { isArchive: true } },
						{ upsert: true }
					);
				} catch (error) {
					if (error.code === 11000) {
						console.error('Duplicate key error:' + error.message);
					} else {
						console.error('Unexpected error occurred:' + error.message);
						throw error;
					}
				}
			}
		}

		for (const customerIdToRemove of previousCustomerIds) {
			try {
				await this.audienceCustomerModel.updateMany(
					{
						customerId: customerIdToRemove,
						storeId,
					},
					{ isArchive: true }
				);
			} catch (error) {
				if (error.code === 11000) {
					console.error('Duplicate key error:' + error.message);
				} else {
					console.error('Unexpected error occurred:' + error.message);
					throw error;
				}
			}
		}
	}

	async frequentFlyerAudience() {
		const currentDate = dayjs(new Date()).format('YYYY-MM-DDT00:00:00.000[Z]');
		const thirtyDaysAgo = dayjs(currentDate)
			.subtract(30, 'day')
			.format('YYYY-MM-DDT00:00:00.000[Z]');
		const formattedFromDate = new Date(thirtyDaysAgo);
		const formattedToDate = new Date(currentDate);

		const posData = await this.POSModel.find({});
		const { _id: audienceId } = await this.audienceDetailsService.getAudienceIdByName(
			AudienceName.FREQUENT_FLYER
		);
		const existingCustomerIds = await this.audienceCustomerModel
			.find({ audienceId }, { customerId: 1 })
			.lean()
			.exec();

		const bulkOperations = [];

		await Promise.all(
			posData.map(async (pos) => {
				const companyData = await this.companyModel.find({ posId: pos._id });

				await Promise.all(
					companyData.map(async (company) => {
						const storeData = await this.storeModel.find({ companyId: company._id });

						await Promise.all(
							storeData.map(async (store) => {
								const pipeline: PipelineStage[] = [
									{
										$match: {
											storeId: store._id,
											posCreatedAt: {
												$gte: formattedFromDate,
												$lte: formattedToDate,
											},
										},
									},
									{
										$group: {
											_id: {
												customerId: '$customerId',
											},
											count: { $sum: 1 },
										},
									},
									{
										$match: {
											count: { $gte: 2 },
										},
									},
									{
										$project: {
											customerId: '$_id.customerId',
											count: 1,
											_id: 0,
										},
									},
								];

								const result = await this.orderModel.aggregate(pipeline);
								const currentCustomerIdsSet = new Set(
									result.map((item) => item.customerId.toString())
								);
								const missingCustomerIds = existingCustomerIds.filter(
									(item) => !currentCustomerIdsSet.has(item.customerId.toString())
								);

								const insertOperations = result.map((item) => ({
									insertOne: {
										document: {
											audienceId,
											customerId: item.customerId,
											storeId: store._id,
										},
									},
								}));

								bulkOperations.push(...insertOperations);

								const updateOperations = missingCustomerIds.map((missingCustomerId) => ({
									updateOne: {
										filter: {
											audienceId,
											storeId: store._id,
											customerId: missingCustomerId.customerId,
										},
										update: {
											$set: { isArchive: true },
										},
									},
								}));

								bulkOperations.push(...updateOperations);
							})
						);
					})
				);
			})
		);

		try {
			await this.audienceCustomerModel.bulkWrite(bulkOperations);
		} catch (error) {
			if (error.code === 11000) {
				console.error('Duplicate key error:' + error.message);
			} else {
				console.error('Unexpected error occurred:' + error.message);
				throw error;
			}
		}
	}

	async averageCartSize(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		try {
			const pipeline = [
				{
					$match: {
						storeId: new Types.ObjectId(storeId),
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
						},
					},
				},
				{
					$group: {
						_id: null,
						averageCartSize: { $avg: '$totals.subTotal' },
					},
				},
				{
					$project: {
						_id: 0,
						averageCartSize: { $round: ['$averageCartSize', 2] },
					},
				},
			];

			const result = await this.orderModel.aggregate(pipeline);
			const { averageCartSize } = result.length > 0 ? result[0] : { averageCartSize: null };
			return { averageCartSize };
		} catch (error) {
			console.error(error);
			dynamicCatchException(error);
		}
	}

	async getCampaignWiseCustomer(campaignId: string) {
		const audienceData = await this.audienceCustomerModel.find({
			campaignId: new Types.ObjectId(campaignId),
			customerId: { $type: 'objectId' },
		});
		return audienceData;
	}
}
