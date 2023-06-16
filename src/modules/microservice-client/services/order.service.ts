import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';

import { Order } from '../../../microservices/order/entities/order.entity';

@Injectable()
export class OrderService {
	constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

	async getOrderForEachDate(locationId: string, fromDate: string, toDate: string) {
		const fromStartDate = new Date(fromDate);
		const fromEndDate = new Date(toDate);
		const pipeline: PipelineStage[] = [
			{
				$match: {
					locationId,
					posCreatedAt: {
						$gte: fromStartDate,
						$lte: fromEndDate,
					},
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$posCreatedAt',
						},
					},
					date: {
						$first: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$posCreatedAt',
							},
						},
					},
					count: { $sum: 1 },
					totalAmount: { $sum: '$totals.finalTotal' },
				},
			},
			{
				$sort: {
					date: 1,
				},
			},
			{
				$project: {
					_id: 0, // Exclude the _id field from the output
					date: 1,
					count: 1,
					totalAmount: { $round: ['$totalAmount', 2] },
				},
			},
		];

		let dateWiseOrderData = await this.orderModel.aggregate(pipeline);

		return dateWiseOrderData;
	}

	async getBrandWiseSales(locationId: string) {
		const pipeline: PipelineStage[] = [
			{
				$match: {
					locationId: locationId,
					posCreatedAt: {
						$gte: new Date(new Date().setDate(new Date().getDate() - 14)),
						$lte: new Date(),
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
					as: 'product',
				},
			},
			{
				$unwind: {
					path: '$product',
				},
			},
			{
				$group: {
					_id: {
						brand: '$product.title2',
					},
					totalAmount: {
						$sum: '$totals.finalTotal',
					},
				},
			},
			{
				$sort: {
					totalAmount: -1,
				},
			},
			{
				$limit: 5,
			},
			{
				$project: {
					_id: 0,
					brand: '$_id.brand',
					totalAmount: 1,
				},
			},
		];

		let brandWiseOrderData = await this.orderModel.aggregate(pipeline);

		return brandWiseOrderData;
	}

	async getEmployeeWiseSales(locationId: string) {
		const pipeline: PipelineStage[] = [
			{
				$match: {
					locationId,
					posCreatedAt: {
						$gte: new Date(new Date().setDate(new Date().getDate() - 14)),
						$lte: new Date(),
					},
				},
			},
			{
				$group: {
					_id: '$staffId',
					totalSales: { $sum: '$totals.finalTotal' },
				},
			},
			{
				$sort: { totalSales: -1 },
			},
			{
				$limit: 5,
			},
			{
				$lookup: {
					from: 'staff',
					localField: '_id',
					foreignField: '_id',
					as: 'employee',
				},
			},
			{
				$unwind: '$employee',
			},
			{
				$lookup: {
					from: 'orders',
					let: { staffId: '$employee._id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$staffId', '$$staffId'] },
										{
											$gte: ['$posCreatedAt', new Date(new Date().setDate(new Date().getDate() - 28))],
										},
										{
											$lte: ['$posCreatedAt', new Date(new Date().setDate(new Date().getDate() - 14))],
										},
									],
								},
							},
						},
						{
							$group: {
								_id: '$staffId',
								previousSales: { $sum: '$totals.finalTotal' },
							},
						},
					],
					as: 'previousSalesData',
				},
			},
			{
				$unwind: {
					path: '$previousSalesData',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$project: {
					staffId: '$_id',
					staffName: '$employee.staffName',
					totalSales: 1,
					previousSales: {
						$ifNull: ['$previousSalesData.previousSales', 0],
					},
				},
			},
			{
				$addFields: {
					growthPercentage: {
						$cond: [
							{ $eq: ['$previousSales', 0] },
							0,
							{
								$multiply: [
									{
										$divide: [
											{
												$subtract: ['$totalSales', '$previousSales'],
											},
											'$previousSales',
										],
									},
									100,
								],
							},
						],
					},
				},
			},
			{
				$project: {
					_id: 0,
					staffId: 1,
					staffName: 1,
					totalAmount: '$totalSales',
					growthPercentage: { $round: ['$growthPercentage', 2] },
				},
			},
		];

		let staffWiseOrderData = await this.orderModel.aggregate(pipeline);

		return staffWiseOrderData;
	}

	async getAverageSpendAndLoyaltyPointsForAllCustomer(locationId: string) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						locationId,
					},
				},
				{
					$group: {
						_id: '$customerId',
						averageSpend: { $avg: '$totals.finalTotal' },
						totalPoints: { $sum: '$currentPoints' },
					},
				},
				{
					$group: {
						_id: null,
						averageSpend: { $avg: '$averageSpend' },
						totalPointsConverted: { $sum: '$totalPoints' },
					},
				},
				{
					$project: {
						_id: 0,
						averageSpend: { $round: ['$averageSpend', 2] },
						loyaltyPointsConverted: '$totalPointsConverted',
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			const averageSpendWithLoyalty = result.length > 0 ? result[0] : { averageSpend: 0, loyaltyPointsConverted: 0 };

			return averageSpendWithLoyalty;
		} catch (error) {}
	}

	async getTopCategory(locationId: string) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						locationId,
					},
				},
				{
					$unwind: '$itemsInCart',
				},
				{
					$lookup: {
						from: 'cart',
						localField: 'itemsInCart',
						foreignField: '_id',
						as: 'category',
					},
				},
				{
					$unwind: '$category',
				},
				{
					$group: {
						_id: '$category.category',
						totalAmount: { $sum: '$totals.finalTotal' },
					},
				},
				{
					$sort: {
						totalAmount: -1,
					},
				},
				{
					$limit: 1,
				},
				{
					$project: {
						_id: 0,
						topCategory: '$_id',
						totalAmount: 1,
					},
				},
			];

			const result = await this.orderModel.aggregate(pipeline);

			const { totalAmount, topCategory } = result.length > 0 ? result[0] : { totalAmount: 0, topCategory: '' };
			return topCategory;
		} catch (error) {}
	}

	async getRecurringAndNewCustomerPercentage(locationId: string) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						locationId,
					},
				},
				{
					$group: {
						_id: '$customerId',
						orderCount: { $sum: 1 },
					},
				},
				{
					$group: {
						_id: null,
						recurringCustomers: {
							$sum: {
								$cond: [{ $gt: ['$orderCount', 1] }, 1, 0],
							},
						},
						newCustomers: {
							$sum: {
								$cond: [{ $eq: ['$orderCount', 1] }, 1, 0],
							},
						},
						totalCustomers: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						returningCustomer: {
							$round: [
								{
									$multiply: [
										{
											$divide: ['$recurringCustomers', '$totalCustomers'],
										},
										100,
									],
								},
								2,
							],
						},
						newCustomer: {
							$round: [
								{
									$multiply: [
										{
											$divide: ['$newCustomers', '$totalCustomers'],
										},
										100,
									],
								},
								2,
							],
						},
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			const { returningCustomer, newCustomer } = result.length > 0 ? result[0] : { returningCustomer: 0, newCustomer: 0 };
			return { returningCustomer: returningCustomer, newCustomer };
		} catch (error) {
			console.log('Error While Calculating the percentage', error);
		}
	}

	async totalOverViewCountForOrdersBetweenDate(locationId: string, fromDate: string, toDate: string) {
		const startDateStartTime = new Date(fromDate);
		const startDateEndTime = new Date(fromDate);
		const endDateStartTime = new Date(toDate);
		const endDateEndTime = new Date(toDate);

		startDateEndTime.setUTCHours(23, 59, 59, 999);
		endDateStartTime.setUTCHours(0, 0, 0, 0);

		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						locationId,
						posCreatedAt: {
							$gte: startDateStartTime,
							$lte: endDateEndTime,
						},
					},
				},
				{
					$group: {
						_id: null,
						totalOrderAmount: { $sum: '$totals.finalTotal' },
						totalDiscounts: { $sum: '$totals.totalDiscounts' },
						totalOrders: { $sum: 1 },
						fromDateTotalAmount: {
							$sum: {
								$cond: [
									{
										$lt: ['$posCreatedAt', startDateEndTime],
									},
									'$totals.finalTotal',
									0,
								],
							},
						},
						toDateTotalAmount: {
							$sum: {
								$cond: [
									{
										$gte: ['$posCreatedAt', endDateStartTime],
									},
									'$totals.finalTotal',
									0,
								],
							},
						},
						fromDateTotalDiscount: {
							$sum: {
								$cond: [
									{
										$lt: ['$posCreatedAt', startDateEndTime],
									},
									'$totals.totalDiscounts',
									0,
								],
							},
						},
						toDateTotalDiscount: {
							$sum: {
								$cond: [
									{
										$gte: ['$posCreatedAt', endDateStartTime],
									},
									'$totals.totalDiscounts',
									0,
								],
							},
						},
						fromDateOrderCount: {
							$sum: {
								$cond: [
									{
										$lt: ['$posCreatedAt', startDateEndTime],
									},
									1,
									0,
								],
							},
						},
						toDateOrderCount: {
							$sum: {
								$cond: [
									{
										$gte: ['$posCreatedAt', endDateStartTime],
									},
									1,
									0,
								],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						totalOrderAmount: 1,
						totalDiscounts: 1,
						totalOrders: 1,
						orderAmountGrowth: {
							$round: [
								{
									$multiply: [
										{
											$divide: [
												{
													$subtract: ['$toDateTotalAmount', '$fromDateTotalAmount'],
												},
												{
													$cond: [
														{
															$eq: ['$fromDateTotalAmount', 0],
														},
														1,
														'$fromDateTotalAmount',
													],
												},
											],
										},
										100,
									],
								},
								2,
							],
						},
						discountGrowth: {
							$round: [
								{
									$multiply: [
										{
											$divide: [
												{
													$subtract: ['$toDateTotalDiscount', '$fromDateTotalDiscount'],
												},
												{
													$cond: [
														{
															$eq: ['$fromDateTotalDiscount', 0],
														},
														1,
														'$fromDateTotalDiscount',
													],
												},
											],
										},
										100,
									],
								},
								2,
							],
						},
						orderCountGrowth: {
							$round: [
								{
									$multiply: [
										{
											$divide: [
												{
													$subtract: ['$toDateOrderCount', '$fromDateOrderCount'],
												},
												{
													$cond: [
														{
															$eq: ['$fromDateOrderCount', 0],
														},
														1,
														'$fromDateOrderCount',
													],
												},
											],
										},
										100,
									],
								},
								2,
							],
						},
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			const { totalOrderAmount, totalDiscounts, totalOrders, orderAmountGrowth, discountGrowth, orderCountGrowth } =
				result.length > 0
					? result[0]
					: {
							totalOrderAmount: 0,
							totalDiscounts: 0,
							totalOrders: 0,
							orderAmountGrowth: 0,
							discountGrowth: 0,
							orderCountGrowth: 0,
					  };
			return {
				totalOrderAmount,
				totalDiscounts,
				totalOrders,
				orderAmountGrowth,
				discountGrowth,
				orderCountGrowth,
			};
		} catch (error) {
			console.log('Error While Fetching Overview Section', error);
		}
	}

	async getHourWiseDateForSpecificDateRange(locationId: string) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						locationId,
						posCreatedAt: {
							$gte: new Date(new Date().setDate(new Date().getDate() - 14)),
							$lte: new Date(),
						},
					},
				},
				{
					$group: {
						_id: {
							hour: { $hour: '$posCreatedAt' },
							isAM: { $lt: [{ $hour: '$posCreatedAt' }, 12] },
						},
						count: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						hour: {
							$concat: [
								{
									$cond: {
										if: { $eq: ['$_id.isAM', true] },
										then: {
											$concat: [{ $toString: '$_id.hour' }, ' AM'],
										},
										else: {
											$concat: [
												{
													$toString: {
														$subtract: ['$_id.hour', 12],
													},
												},
												' PM',
											],
										},
									},
								},
							],
						},
						count: 1,
					},
				},
				{
					$sort: { '_id.hour': -1 },
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			let hourlyData = result.length > 0 ? result : [];
			return hourlyData;
		} catch (error) {}
	}

	async getWeeklyBusiestDataForSpecificRange(locationId: string) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						locationId,
						posCreatedAt: {
							$gte: new Date(new Date().setDate(new Date().getDate() - 14)),
							$lte: new Date(),
						},
					},
				},
				{
					$group: {
						_id: { $dayOfWeek: '$posCreatedAt' },
						count: { $sum: 1 },
					},
				},
				{
					$sort: { _id: 1 },
				},
				{
					$project: {
						_id: 0,
						dayOfWeek: {
							$switch: {
								branches: [
									{
										case: { $eq: ['$_id', 1] },
										then: 'Sunday',
									},
									{
										case: { $eq: ['$_id', 2] },
										then: 'Monday',
									},
									{
										case: { $eq: ['$_id', 3] },
										then: 'Tuesday',
									},
									{
										case: { $eq: ['$_id', 4] },
										then: 'Wednesday',
									},
									{
										case: { $eq: ['$_id', 5] },
										then: 'Thursday',
									},
									{
										case: { $eq: ['$_id', 6] },
										then: 'Friday',
									},
									{
										case: { $eq: ['$_id', 7] },
										then: 'Saturday',
									},
								],
								default: 'Unknown',
							},
						},
						count: 1,
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			let weekData = result.length > 0 ? result : [];
			return weekData;
		} catch (error) {}
	}
}
