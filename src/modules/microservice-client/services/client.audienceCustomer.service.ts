import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AudienceCustomer } from '../entities/audienceCustomers.entity';
import * as dayjs from 'dayjs';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Model, PipelineStage, Types } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { Store } from 'src/model/store/entities/store.entity';
import { ClientOrderService } from './client.order.service';
import { AudienceDetailsService } from './client.audienceDetail.service';
import { AudienceName } from 'src/common/constants';
import { Order } from 'src/microservices/order/entities/order.entity';

@Injectable()
export class ClientAudienceCustomerService {
	constructor(
		@InjectModel(AudienceCustomer.name)
		private readonly audienceCustomerModel: Model<AudienceCustomer>,
		@InjectModel(POS.name) private readonly POSModel: Model<POS>,
		@InjectModel(Order.name) private readonly orderModel: Model<Order>,
		@InjectModel(Company.name)
		private readonly companyModel: Model<Company>,
		@InjectModel(Store.name) private readonly storeModel: Model<Store>,
		private readonly clientOrderService: ClientOrderService,
		private readonly audienceDetailsService: AudienceDetailsService
	) {}

	async seedAudiceCustomers() {
		try {
			const currentDate = dayjs(new Date()).format(
				'YYYY-MM-DDT00:00:00.000[Z]'
			);
			const fromDate = dayjs(currentDate)
				.subtract(15, 'day')
				.format('YYYY-MM-DDT00:00:00.000[Z]');

			const posData = await this.POSModel.findOne({ name: 'flowhub' });

			const companyData = await this.companyModel.find({
				posId: posData._id,
			});

			for (const company of companyData) {
				const storeData = await this.storeModel.find({
					companyId: company._id,
				});

				for (const store of storeData) {
					await this.bigSpenderOrValueShopper(
						store._id as Types.ObjectId,
						fromDate,
						currentDate
					);
					await this.purchaseCategoryAudience(
						store._id as Types.ObjectId,
						fromDate,
						currentDate
					);
				}
			}
		} catch (error) {
			console.trace(error);
			throw error;
		}
	}

	async bigSpenderOrValueShopper(storeId, fromDate, toDate) {
		const formattedFromDate = new Date(fromDate);
		const formattedToDate = new Date(toDate);
		const bigSpenderAudience =
			await this.audienceDetailsService.getAudienceIdByName(
				AudienceName.BIG_SPENDER
			);
		const valueShopperAudience =
			await this.audienceDetailsService.getAudienceIdByName(
				AudienceName.VALUE_SHOPPER
			);

		const { averageCartSize } =
			await this.clientOrderService.averageCartSize(
				storeId,
				fromDate,
				toDate
			);

		const pipeline: PipelineStage[] = [
			{
				$match: {
					storeId,
					posCreatedAt: {
						$gte: formattedFromDate,
						$lt: formattedToDate,
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
				for (const customerId of bigSpenders) {
					await this.audienceCustomerModel.create({
						storeId,
						customerId,
						audienceId: bigSpenderAudience._id,
					});
				}

				for (const customerId of valueShoppers) {
					await this.audienceCustomerModel.create({
						storeId,
						customerId,
						audienceId: valueShopperAudience._id,
					});
				}
			} catch (error) {
				console.error('Unexpected error occurred:', error.message);
				throw error;
			}
		} else {
			for (const customerId of previousCronJobCustomers) {
				try {
					const isPresentInCurrentRun =
						bigSpenders.includes(customerId) ||
						valueShoppers.includes(customerId);
					const isBigSpenderInCurrentRun =
						bigSpenders.includes(customerId);
					const existingRecord =
						await this.audienceCustomerModel.findOne({
							storeId,
							customerId,
						});

					if (isPresentInCurrentRun) {
						if (existingRecord) {
							if (
								isBigSpenderInCurrentRun &&
								existingRecord.audienceId !==
									bigSpenderAudience._id
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
								existingRecord.audienceId !==
									valueShopperAudience._id
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
						console.error('Duplicate key error:', error.message);
					} else {
						console.error(
							'Unexpected error occurred:',
							error.message
						);
						throw error;
					}
				}
			}
		}
	}

	async purchaseCategoryAudience(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
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
					from: 'cart',
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
		let name: string = '';
		const audienceIdMap: { [key: string]: Types.ObjectId } = {};

		const uniqueCategories = [
			...new Set(result.map((item) => item.purchaseCategory)),
		];
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

		const previousAudienceCustomers = await this.audienceCustomerModel.find(
			{
				storeId,
				$or: [
					{ audienceId: audienceIdMap['Flower'] },
					{ audienceId: audienceIdMap['Edible'] },
					{ audienceId: audienceIdMap['Concentrate'] },
				],
			}
		);

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
				const audienceId : any = audienceIdMap[purchaseCategory];

				try {
					const existingAudienceCustomer =
						await this.audienceCustomerModel.findOne({
							customerId,
							audienceId,
							storeId,
						});

					if (!existingAudienceCustomer) {
						await this.audienceCustomerModel.create({
							audienceId,
							customerId,
							storeId,
						});
					} else {
						if (
							existingAudienceCustomer.audienceId !==
							audienceId.toString()
						) {
							await this.audienceCustomerModel.create({
								audienceId,
								customerId,
								storeId,
							});
						}
						await this.audienceCustomerModel.updateOne(
							{
								_id: existingAudienceCustomer._id,
							},
							{ $set: { isArchive: true } }
						);
					}
				} catch (error) {
					if (error.code === 11000) {
						console.error('Duplicate key error:', error.message);
					} else {
						console.error(
							'Unexpected error occurred:',
							error.message
						);
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
					console.error('Duplicate key error:', error.message);
				} else {
					console.error('Unexpected error occurred:', error.message);
					throw error;
				}
			}
		}
	}

	async frequentFlyerAudience() {
		const currentDate = dayjs(new Date()).format(
			'YYYY-MM-DDT00:00:00.000[Z]'
		);
		const thirtyDaysAgo = dayjs(currentDate)
			.subtract(30, 'day')
			.format('YYYY-MM-DDT00:00:00.000[Z]');
		const formattedFromDate = new Date(thirtyDaysAgo);
		const formattedToDate = new Date(currentDate);

		const posData = await this.POSModel.findOne({ name: 'flowhub' });

		const companyData = await this.companyModel.find({
			posId: posData._id,
		});

		const { _id: audienceId } =
			await this.audienceDetailsService.getAudienceIdByName(
				AudienceName.FREQUENT_FLYER
			);

		const existingCustomerIds = await this.audienceCustomerModel
			.find({ audienceId }, { customerId: 1 })
			.lean()
			.exec();

		for (const company of companyData) {
			const storeData = await this.storeModel.find({
				companyId: company._id,
			});

			for (const store of storeData) {
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
					(item) =>
						!currentCustomerIdsSet.has(item.customerId.toString())
				);

				for (const item of result) {
					const { customerId } = item;

					try {
						await this.audienceCustomerModel.create({
							audienceId,
							customerId,
							storeId: store._id,
						});
					} catch (error) {
						if (error.code === 11000) {
							console.error(
								'Duplicate key error:',
								error.message
							);
						} else {
							console.error(
								'Unexpected error occurred:',
								error.message
							);
							throw error;
						}
					}
				}

				for (const missingCustomerId of missingCustomerIds) {
					await this.audienceCustomerModel.updateOne(
						{
							audienceId,
							storeId: store._id,
							customerId: missingCustomerId.customerId,
						},
						{ $set: { isArchive: true } }
					);
				}
			}
		}
	}
}
