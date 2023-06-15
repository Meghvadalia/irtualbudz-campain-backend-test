import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Aggregate, Model, PipelineStage } from 'mongoose';
import axios from 'axios';

import { Order } from '../entities/order.entity';
import { Cron } from '@nestjs/schedule';
import { Cart } from '../entities/cart.entity';
import { Staff } from '../entities/staff.entity';
import { IStaff } from '../interfaces/staff.interface';
import { ICompany } from 'src/model/company/interface/company.interface';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Store } from 'src/model/store/entities/store.entity';
import mongoose from 'mongoose';
import { Console } from 'console';
import { from } from 'rxjs';
@Injectable()
export class OrderService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Cart.name) private cartModal: Model<Cart>,
		@InjectModel(Staff.name) private staffModal: Model<Staff>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>
	) {}

	async seedOrders(fromDate: Date, toDate: Date, importId: string) {
		try {
			const monarcCompanyData: ICompany =
				await this.companyModel.findOne<ICompany>({
					name: 'Monarc',
				});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: monarcCompanyData.posId,
			});
			console.log('fromDate', fromDate);
			console.log('toDate', toDate);
			console.log('importId', importId);
			const options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/orders/findByLocationId/${importId}`,
				params: {
					created_after: fromDate,
					created_before: toDate,
					page_size: 10000,
				},
				headers: {
					key: monarcCompanyData.dataObject.key,
					ClientId: monarcCompanyData.dataObject.clientId,
					Accept: 'application/json',
				},
			};

			this.processOrders(options).catch((err) => {
				console.log('Error while processing orders:', err);
			});
		} catch (error) {
			console.error('Error while seeding orders:', error);
		}
	}

	@Cron('0 0 0 * * *')
	async scheduleCronJob() {
		try {
			const currentDate = new Date();
			const fromDate = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth(),
				currentDate.getDate() - 1,
				0,
				0,
				0
			);
			const toDate = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth(),
				currentDate.getDate(),
				0,
				0,
				0
			);

			const monarcCompanyData: ICompany =
				await this.companyModel.findOne<ICompany>({
					name: 'Monarc',
				});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: monarcCompanyData.posId,
			});

			const locations = await this.storeModel.find({
				companyId: monarcCompanyData._id,
			});

			const locationIds = locations.map(({ location }) => location);
			// console.log("Total locations ", data.data.length);
			// Counter to keep track of elapsed time
			let counter = 0;

			// Interval duration in milliseconds
			const intervalDuration = 2000; // 1000 milliseconds = 1 second

			// Maximum time in seconds (2000 seconds)
			const maxTime = locationIds.length;
			// console.log(locationIds)
			const intervalFunction = async () => {
				// Check if the elapsed time exceeds the maximum time
				if (counter >= maxTime) {
					// Stop the interval
					clearInterval(interval);
					console.log('Loop finished!');
					return;
				}

				// Code to execute in each interval
				console.log('Location ID:', locationIds[counter].locationId);
				// // only for company location ID 150
				if (locationIds[counter].locationId == 150) {
					const customersCount =
						await this.orderModel.countDocuments();
					if (customersCount === 0) {
						console.log('Seeding data for the last 100 days...');
						const hundredDaysAgo = new Date(
							currentDate.getFullYear(),
							currentDate.getMonth(),
							currentDate.getDate() - 100,
							0,
							0,
							0
						);
						this.seedOrders(
							hundredDaysAgo,
							toDate,
							locationIds[counter].importId
						);
					} else {
						console.log('Seeding data from the previous day...');
						this.seedOrders(
							fromDate,
							toDate,
							locationIds[counter].importId
						);
					}
				}

				// Increment the counter
				counter++;
			};
			const interval = setInterval(intervalFunction, intervalDuration);
		} catch (error) {
			console.error('Error while scheduling cron job:', error);
		}
	}
	/* addItemCart function accept object of cart
	 * and return array of cart ids
	 */
	addItemCart(carts: any, locationId: any, id: any) {
		return new Promise((resolve, reject) => {
			let tempArr = [];
			for (let i = 0; i < carts.length; i++) {
				tempArr.push(this.addSingleData(carts[i], locationId, id));
			}
			Promise.all(tempArr).then((data) => {
				resolve({ id: id, data: data });
			});
		});
	}
	/*
	 * addStaff function accept object of Staff
	 */
	addStaff(element: any) {
		return new Promise((resolve, reject) => {
			let staffObject: IStaff = {
				staffName: element.staffName,
				storeId: element.locationId,
			};
			return this.staffModal.findOne(staffObject).then((res) => {
				if (res == null) {
					return this.staffModal
						.create(staffObject)
						.then((staffRes) => {
							resolve(staffRes);
						});
				} else {
					resolve(res);
				}
			});
		});
	}
	/* addSingleData function accept object of single cart
	 * and return array of cart ids
	 */
	addSingleData(cart, locationId, id) {
		return new Promise((resolve, reject) => {
			return this.cartModal
				.findOne({
					posCartId: cart.id,
					storeId: locationId,
					productName: cart.productName,
				})
				.then((res) => {
					if (res == null) {
						cart.posCartId = cart.id;
						cart.storeId = locationId;
						delete cart.id;
						try {
							return this.cartModal
								.create(cart)
								.then((newItem) => {
									resolve(newItem._id);
								});
						} catch (error) {
							console.log('error', error);
						}
					} else {
						resolve(res._id);
					}
				});
		});
	}

	/* addStaff function accept object of Staff
	 * and return array of cart ids
	 */
	addOrder(element: any) {
		return new Promise((resolve, reject) => {
			return this.orderModel
				.findOne({ posOrderId: element._id })
				.then((res) => {
					if (res == null) {
						element.posOrderId = element._id;

						element.posCreatedAt = new Date(
							element.createdAt.toString()
						);
						delete element.createdAt;

						// console.log("Id :",element._id, " ==> ",JSON.stringify(element.itemsInCart))
						delete element._id;
						return this.orderModel
							.create(element)
							.then((orderRes) => {
								resolve(orderRes);
							});
					} else {
						// console.log("old")
					}
				});
		});
	}

	async getOrders() {
		const orderList = await this.orderModel.find({
			locationId: 'k5wsZpPcz4C92Q2mW',
		});
		return orderList;
	}

	async fourteenDaysOrderList() {
		const currentDate = new Date('2023-03-14');
		const fourteenDaysAgo = new Date(currentDate);
		fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

		const orders = await this.orderModel.find({
			createdAt: { $gte: fourteenDaysAgo, $lt: currentDate },
		});

		return orders;
	}
	async currentDaysOrderList() {
		var currentDate = new Date('2023-03-14'); // Get the current date and time
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
					posCreatedAt: {
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

	async getEmployeeWiseSales(fromDate, toDate) {
		const fromStartDate = new Date(fromDate);
		const fromEndDate = new Date(toDate);
		const pipeline: PipelineStage[] = [
			{
				$match: {
					posCreatedAt: {
						$gte: fromStartDate,
						$lte: fromEndDate,
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
											$gte: [
												'$posCreatedAt',
												new Date(
													new Date().setDate(
														new Date(
															fromDate
														).getDate() - 14
													)
												),
											],
										},
										{
											$lte: [
												'$posCreatedAt',
												new Date(
													new Date().setDate(
														new Date(
															fromEndDate
														).getDate() - 14
													)
												),
											],
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
												$subtract: [
													'$totalSales',
													'$previousSales',
												],
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

	// Pagination Wise Order List for all the order coming from the FLow Hub API

	async processOrders(options) {
		try {
			console.log('====================================');
			console.log('Processing Order Batch');
			console.log('====================================');
			let page = 1;
			let allOrders = [];

			while (true) {
				options.params.page = page;
				const { data } = await axios.request(options);
				const orders = data.orders;

				if (orders.length > 0) {
					// Process orders in batches
					await this.processOrderBatch(orders, page);
					page++;
				} else {
					// All pages have been fetched
					console.log('All orders fetched');
					break;
				}
			}
		} catch (error) {
			console.log('====================================');
			console.log(error);
			console.log('====================================');
		}
	}
	processOrderBatch(orders, page) {
		try {
			console.log('====================================');
			console.log('Processing Order Batch number', page);
			console.log('====================================');

			let temp = orders.map((x) => ({
				staffName: x.budtender,
				locationId: x.locationId,
				posCreatedAt: new Date(x.createdAt),
			}));
			// remove duplicate object
			let staff = temp.filter(
				(v, i, a) =>
					a.findIndex((v2) =>
						['staffName', 'locationId'].every((k) => v2[k] === v[k])
					) === i
			);
			let staffFun = [];
			let ItemFunction = [];
			/* create function array for promise all
			 * for loop pass object of order
			 */
			for (let index = 0; index < staff.length; index++) {
				let element = staff[index];
				staffFun.push(this.addStaff(element));
			}
			Promise.all(staffFun)
				.then((satfCartData) => {
					for (let index = 0; index < orders.length; index++) {
						let element = orders[index];
						ItemFunction.push(
							this.addItemCart(
								element.itemsInCart,
								element.locationId,
								element._id
							)
						);
					}
					let orderArrayFun = [];
					Promise.all(ItemFunction).then((cart) => {
						// console.log("cart",JSON.stringify(cart))
						for (let k = 0; k < orders.length; k++) {
							let element = orders[k];

							delete element.itemsInCart;
							element.itemsInCart = cart.filter(
								(x) => x.id == element._id
							)[0].data;
							element.staffId = satfCartData.filter(
								(x) => element.budtender == x.staffName
							)[0]._id;

							delete element.budtender;
							// element.itemsInCart = cart[k];
							orderArrayFun.push(this.addOrder(element));
						}
						Promise.all(orderArrayFun).then((order) => {
							console.log('Order Done', order.length);
						});
					});
				})
				.catch((err) => {
					console.log('err :', err);
				});
		} catch (error) {
			console.log('====================================');
			console.log(error);
			console.log('====================================');
		}
	}

	async getAverageSpendAndLoyaltyPointsForAllCustomer(fromDate, toDate) {
		try {
			const fromStartDate = new Date(fromDate);
			const toEndDate = new Date(toDate);
			const pipeline: PipelineStage[] = [
				{
					$match: {
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
						},
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

			const averageSpendWithLoyalty =
				result.length > 0
					? result[0]
					: { averageSpend: 0, loyaltyPointsConverted: 0 };

			return averageSpendWithLoyalty;
		} catch (error) {}
	}

	async getTopCategory(fromDate, toDate) {
		try {
			const fromStartDate = new Date(fromDate);
			const toEndDate = new Date(toDate);
			const pipeline: PipelineStage[] = [
				{
					$match: {
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
						},
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

			const { totalAmount, topCategory } =
				result.length > 0
					? result[0]
					: { totalAmount: 0, topCategory: '' };
			return topCategory;
		} catch (error) {}
	}

	async getRecurringAndNewCustomerPercentage(fromDate, toDate) {
		try {
			const fromStartDate = new Date(fromDate);
			const toEndDate = new Date(toDate);
			const pipeline: PipelineStage[] = [
				{
					$match: {
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
						},
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
											$divide: [
												'$recurringCustomers',
												'$totalCustomers',
											],
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
											$divide: [
												'$newCustomers',
												'$totalCustomers',
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

			const { returningCustomer, newCustomer } =
				result.length > 0
					? result[0]
					: { returningCustomer: 0, newCustomer: 0 };
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

			const { totalDiscounts } =
				result.length > 0 ? result[0] : { totalDiscounts: 0 };
			return totalDiscounts.toFixed(2);
		} catch (error) {
			console.log('====================================');
			console.log('Error While Fetching Total Discounts', error);
			console.log('====================================');
		}
	}
	async totalOverViewCountForOrdersBetweenDate(fromDate, toDate) {
		try {
			fromDate = new Date(fromDate);
			toDate = new Date(toDate);
			const pipeline: PipelineStage[] = [
				{
					$match: {
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
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
						orderCount: { $sum: 1 },
						orderAmount: { $sum: '$totals.finalTotal' },
						discountAmount: { $sum: '$totals.totalDiscounts' },
					},
				},
				{
					$group: {
						_id: null,
						firstDayOrderCount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$_id',
											fromDate
												.toISOString()
												.split('T')[0],
										],
									},
									'$orderCount',
									0,
								],
							},
						},
						lastDayOrderCount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$_id',
											toDate.toISOString().split('T')[0],
										],
									},
									'$orderCount',
									0,
								],
							},
						},
						firstDayOrderAmount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$_id',
											fromDate
												.toISOString()
												.split('T')[0],
										],
									},
									'$orderAmount',
									0,
								],
							},
						},
						lastDayOrderAmount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$_id',
											toDate.toISOString().split('T')[0],
										],
									},
									'$orderAmount',
									0,
								],
							},
						},
						firstDayDiscountAmount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$_id',
											fromDate
												.toISOString()
												.split('T')[0],
										],
									},
									'$discountAmount',
									0,
								],
							},
						},
						lastDayDiscountAmount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$_id',
											toDate.toISOString().split('T')[0],
										],
									},
									'$discountAmount',
									0,
								],
							},
						},
						orderCount: { $sum: '$orderCount' },
						totalOrderAmount: { $sum: '$orderAmount' },
						totalDiscounts: { $sum: '$discountAmount' },
					},
				},
				{
					$project: {
						_id: 0,

						orderCount: 1,

						totalOrderAmount: 1,
						totalDiscounts: 1,
						orderCountGrowth: {
							$cond: [
								{ $eq: ['$firstDayOrderCount', 0] },
								0,
								{
									$multiply: [
										{
											$cond: [
												{
													$gte: [
														'$lastDayOrderCount',
														'$firstDayOrderCount',
													],
												},
												1,
												-1,
											],
										},
										{
											$trunc: {
												$multiply: [
													{
														$abs: {
															$divide: [
																{
																	$subtract: [
																		'$lastDayOrderCount',
																		'$firstDayOrderCount',
																	],
																},
																'$firstDayOrderCount',
															],
														},
													},
													100,
												],
											},
										},
									],
								},
							],
						},
						orderGrowth: {
							$cond: [
								{ $eq: ['$firstDayOrderAmount', 0] },
								0,
								{
									$multiply: [
										{
											$cond: [
												{
													$gte: [
														'$lastDayOrderAmount',
														'$firstDayOrderAmount',
													],
												},
												1,
												-1,
											],
										},
										{
											$trunc: {
												$multiply: [
													{
														$abs: {
															$divide: [
																{
																	$subtract: [
																		'$lastDayOrderAmount',
																		'$firstDayOrderAmount',
																	],
																},
																'$firstDayOrderAmount',
															],
														},
													},
													100,
												],
											},
										},
									],
								},
							],
						},
						discountGrowth: {
							$cond: [
								{ $eq: ['$firstDayDiscountAmount', 0] },
								0,
								{
									$multiply: [
										{
											$cond: [
												{
													$gte: [
														'$lastDayDiscountAmount',
														'$firstDayDiscountAmount',
													],
												},
												1,
												-1,
											],
										},
										{
											$trunc: {
												$multiply: [
													{
														$abs: {
															$divide: [
																{
																	$subtract: [
																		'$lastDayDiscountAmount',
																		'$firstDayDiscountAmount',
																	],
																},
																'$firstDayDiscountAmount',
															],
														},
													},
													100,
												],
											},
										},
									],
								},
							],
						},
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			const {
				totalOrderAmount,
				totalDiscounts,
				orderCount,
				orderGrowth,
				discountGrowth,
				orderCountGrowth,
			} =
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

	async getHourWiseDateForSpecificDateRange(fromDate, toDate) {
		try {
			const fromStartDate = new Date(fromDate);
			const toEndDate = new Date(toDate);
			const pipeline: PipelineStage[] = [
				{
					$match: {
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
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
											$concat: [
												{ $toString: '$_id.hour' },
												' AM',
											],
										},
										else: {
											$concat: [
												{
													$toString: {
														$subtract: [
															'$_id.hour',
															12,
														],
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

	async getWeeklyBusiestDataForSpecificRange(fromDate, toDate) {
		try {
			const fromStartDate = new Date(fromDate);
			const toEndDate = new Date(toDate);
			const pipeline: PipelineStage[] = [
				{
					$match: {
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
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
