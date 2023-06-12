import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';

import { Order } from '../../../microservices/order/entities/order.entity';

@Injectable()
export class OrderService {
	constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

	async getOrders() {
		const orderList = await this.orderModel.find({
			locationId: 'k5wsZpPcz4C92Q2mW',
		});
		return orderList;
	}

	async currentDaysOrderList() {
		var currentDate = new Date(); // Get the current date and time
		// Set the time to the beginning of the current day
		currentDate.setHours(0, 0, 0, 0);
		// Set the time to the end of the current day
		var endDate = new Date(currentDate);
		endDate.setHours(23, 59, 59, 999);
		const orders = await this.orderModel.find({
			createdAt: { $gte: currentDate, $lt: endDate },
		});
		return orders;
	}

	async getOrdersByDate(fromDate, toDate) {
		const fromStartDate = new Date(fromDate);
		const fromEndDate = new Date(fromDate);
		fromEndDate.setDate(fromEndDate.getDate() + 1);

		const toStartDate = new Date(toDate);
		const toEndDate = new Date(toDate);
		toEndDate.setDate(toEndDate.getDate() + 1);

		const orderList = await this.orderModel.find({
			createdAt: {
				$gte: fromStartDate,
				$lt: toEndDate,
			},
		});

		const fromOrderList = await this.orderModel.find({
			createdAt: {
				$gte: fromStartDate,
				$lt: fromEndDate,
			},
		});

		const toOrderList = await this.orderModel.find({
			createdAt: {
				$gte: toStartDate,
				$lt: toEndDate,
			},
		});

		return {
			orderList,
			fromOrderList,
			toOrderList,
		};
	}

	async getOrderForEachDate(fromDate, toDate) {
		const fromStartDate = new Date(fromDate);
		const fromEndDate = new Date(toDate);
		const pipeline: PipelineStage[] = [
			{
				$match: {
					posCreatedAt: {
						$gte: fromStartDate, // Specify the "from" date in ISO format
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
					totalAmount: 1,
				},
			},
		];

		let dateWiseOrderData = await this.orderModel.aggregate(pipeline);

		return dateWiseOrderData;
	}

	async getBrandWiseSales(fromDate, toDate) {
		const fromStartDate = new Date(fromDate);
		const fromEndDate = new Date(toDate);
		const pipeline: PipelineStage[] = [
			{
				$match: {
					createdAt: {
						$gte: fromStartDate, // Specify the "from" date in ISO format
						$lte: fromEndDate,
					},
				},
			},
			{
				$unwind: '$itemsInCart', // Unwind the itemsInCart array
			},
			{
				$lookup: {
					from: 'cart', // Replace "products" with the actual name of your products collection
					localField: 'itemsInCart',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$unwind: '$product', // Unwind the product array
			},
			{
				$group: {
					_id: {
						brand: '$product.title2',
					},

					totalAmount: { $sum: '$totals.finalTotal' },
				},
			},
			{
				$sort: {
					totalAmount: -1, // Sort in descending order based on totalAmount
				},
			},
			{
				$limit: 5, // Limit the result to the top 5 brands
			},
			{
				$project: {
					_id: 0, // Exclude the _id field from the output
					brand: '$_id.brand',
					totalAmount: 1,
				},
			},
		];

		let brandWiseOrderData = await this.orderModel.aggregate(pipeline);

		return brandWiseOrderData;
	}

	async getEmployeeWiseSales() {
		const pipeline: PipelineStage[] = [
			{
				$match: {
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

	async getAverageSpendAndLoyaltyPointsForAllCustomer() {
		try {
			const pipeline: PipelineStage[] = [
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

	async getTopCategory() {
		try {
			const pipeline: PipelineStage[] = [
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

	async getRecurringAndNewCustomerPercentage() {
		try {
			const pipeline: PipelineStage[] = [
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

	async getAllTotalDiscount() {
		try {
			const pipeline: PipelineStage[] = [
				{
					$group: {
						_id: null,
						totalDiscounts: { $sum: '$totals.totalDiscounts' },
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			const { totalDiscounts } = result.length > 0 ? result[0] : { totalDiscounts: 0 };
			return totalDiscounts.toFixed(2);
		} catch (error) {
			console.log('====================================');
			console.log('Error While Fetching Total Discounts', error);
			console.log('====================================');
		}
	}
	async totalOverViewCountForOrdersBetweenDate(fromDate, toDate) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						posCreatedAt: {
							$gte: new Date(fromDate),
							$lte: new Date(toDate),
						},
					},
				},
				{
					$group: {
						_id: null,
						totalOrderAmount: { $sum: '$totals.finalTotal' },
						totalDiscounts: { $sum: '$totals.totalDiscounts' },
						orderCount: { $sum: 1 },
						minDate: { $min: '$posCreatedAt' },
						maxDate: { $max: '$posCreatedAt' },
					},
				},
				{
					$project: {
						_id: 0,
						totalOrderAmount: 1,
						totalDiscounts: 1,
						orderCount: 1,
						startDate: { $year: '$minDate' },
						endDate: { $year: '$maxDate' },
					},
				},
				{
					$group: {
						_id: null,
						totalOrderAmount: { $sum: '$totalOrderAmount' },
						totalDiscounts: { $sum: '$totalDiscounts' },
						orderCount: { $sum: '$orderCount' },
						startDate: { $min: '$startDate' },
						endDate: { $max: '$endDate' },
					},
				},
				{
					$lookup: {
						from: 'orders',
						let: { startDate: '$startDate', endDate: '$endDate' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{
												$gte: [{ $year: '$posCreatedAt' }, '$$startDate'],
											},
											{
												$lte: [{ $year: '$posCreatedAt' }, '$$endDate'],
											},
										],
									},
								},
							},
							{
								$group: {
									_id: null,
									totalOrderAmount: {
										$sum: '$totals.finalTotal',
									},
									totalDiscounts: {
										$sum: '$totals.totalDiscounts',
									},
									orderCount: { $sum: 1 },
								},
							},
						],
						as: 'orders',
					},
				},
				{
					$unwind: '$orders',
				},
				{
					$project: {
						_id: 0,
						totalOrderAmount: 1,
						totalDiscounts: 1,
						orderCount: 1,
						orderGrowth: {
							$cond: [
								{ $eq: ['$totalOrderAmount', 0] },
								0,
								{
									$round: [
										{
											$multiply: [
												{
													$divide: [
														{
															$subtract: ['$orders.totalOrderAmount', '$totalOrderAmount'],
														},
														{
															$abs: '$totalOrderAmount',
														},
													],
												},
												100,
											],
										},
										2,
									],
								},
							],
						},
						discountGrowth: {
							$cond: [
								{ $eq: ['$totalDiscounts', 0] },
								0,
								{
									$round: [
										{
											$multiply: [
												{
													$divide: [
														{
															$subtract: ['$orders.totalDiscounts', '$totalDiscounts'],
														},
														{
															$abs: '$totalDiscounts',
														},
													],
												},
												100,
											],
										},
										2,
									],
								},
							],
						},
						orderCountGrowth: {
							$cond: [
								{ $eq: ['$orderCount', 0] },
								0,
								{
									$round: [
										{
											$multiply: [
												{
													$divide: [
														{
															$subtract: ['$orders.orderCount', '$orderCount'],
														},
														{ $abs: '$orderCount' },
													],
												},
												100,
											],
										},
										2,
									],
								},
							],
						},
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			const { totalOrderAmount, totalDiscounts, orderCount, orderGrowth, discountGrowth, orderCountGrowth } =
				result.length > 0
					? result[0]
					: {
							totalOrderAmount: 0,
							totalDiscounts: 0,
							orderCount: 0,
							orderGrowth: 0,
							discountGrowth: 0,
							orderCountGrowth: 0,
					  };
			return {
				totalOrderAmount,
				totalDiscounts,
				orderCount,
				orderGrowth,
				discountGrowth,
				orderCountGrowth,
			};
		} catch (error) {
			console.log('Error While Fetching Overview Section', error);
		}
	}

	async getHourWiseDateForSpecificDateRange() {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
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

	async getWeeklyBusiestDataForSpecificRange() {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
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
