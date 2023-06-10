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
			console.log('fromDate', fromDate);
			console.log('toDate', toDate);
			console.log('importId', importId);
			const options = {
				method: 'get',
				url: `${process.env.FLOWHUB_URL}/v1/orders/findByLocationId/${importId}`,
				params: {
					created_after: fromDate,
					created_before: toDate,
					page_size: 10000,
				},
				headers: {
					key: process.env.FLOWHUB_KEY,
					ClientId: process.env.FLOWHUB_CLIENT_ID,
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);
			// console.log(JSON.stringify(data.orders.map((x)=>x._id)))
			let temp = data.orders.map((x) => ({
				staffName: x.budtender,
				locationId: x.locationId,
			}));
			// remove duplicate object
			let staff = temp.filter((v, i, a) => a.findIndex((v2) => ['staffName', 'locationId'].every((k) => v2[k] === v[k])) === i);
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
					for (let index = 0; index < data.orders.length; index++) {
						let element = data.orders[index];
						ItemFunction.push(this.addItemCart(element.itemsInCart, element.locationId, element._id));
					}
					let orderArrayFun = [];
					Promise.all(ItemFunction).then((cart) => {
						// console.log("cart",JSON.stringify(cart))
						for (let k = 0; k < data.orders.length; k++) {
							let element = data.orders[k];
							// element.itemsInCart = cart[k];
							delete element.itemsInCart;
							element.itemsInCart = cart.filter((x) => x.id == element._id)[0].data;
							element.staffId = satfCartData.filter((x) => element.budtender == x.staffName)[0]._id;
							delete element.budtender;
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
			console.error('Error while seeding orders:', error);
		}
	}

	@Cron('0 0 0 * * *')
	async scheduleCronJob() {
		try {
			const currentDate = new Date();
			const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
			const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({
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
					const customersCount = await this.orderModel.countDocuments();
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
						this.seedOrders(hundredDaysAgo, toDate, locationIds[counter].importId);
					} else {
						console.log('Seeding data from the previous day...');
						this.seedOrders(fromDate, toDate, locationIds[counter].importId);
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
					return this.staffModal.create(staffObject).then((staffRes) => {
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
							return this.cartModal.create(cart).then((newItem) => {
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
			return this.orderModel.findOne({ posOrderId: element._id }).then((res) => {
				if (res == null) {
					element.posOrderId = element._id;
					// console.log("Id :",element._id, " ==> ",JSON.stringify(element.itemsInCart))
					delete element._id;
					return this.orderModel.create(element).then((orderRes) => {
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
					createdAt: {
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
							date: '$createdAt',
						},
					},
					date: {
						$first: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$createdAt',
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
		console.log(pipeline);
		let dateWiseOrderData = await this.orderModel.aggregate(pipeline);
		console.log('Data', dateWiseOrderData);
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
		console.log('====================================');
		console.log(brandWiseOrderData);
		console.log('====================================');
		return brandWiseOrderData;
	}

	async getEmployeeWiseSales(fromDate, toDate) {
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
					from: 'staff', // Replace "staff" with the actual name of your staff collection
					localField: 'staffId',
					foreignField: '_id',
					as: 'staff',
				},
			},
			{
				$unwind: '$staff', // Unwind the staff array
			},
			{
				$group: {
					_id: {
						staffName: '$staff.staffName',
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
					staffName: '$_id.staffName',
					totalAmount: 1,
				},
			},
		];

		let staffWiseOrderData = await this.orderModel.aggregate(pipeline);
		console.log('====================================');
		console.log(staffWiseOrderData);
		console.log('====================================');
		return staffWiseOrderData;
	}
}
