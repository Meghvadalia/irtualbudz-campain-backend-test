import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({
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
			const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
			const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({
				name: 'Monarc',
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
				// if (locationIds[counter].locationId == 150) {
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
				// }

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

					element.posCreatedAt = new Date(element.createdAt.toString());
					delete element.createdAt;

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
					for (let index = 0; index < orders.length; index++) {
						let element = orders[index];
						ItemFunction.push(this.addItemCart(element.itemsInCart, element.locationId, element._id));
					}
					let orderArrayFun = [];
					Promise.all(ItemFunction).then((cart) => {
						// console.log("cart",JSON.stringify(cart))
						for (let k = 0; k < orders.length; k++) {
							let element = orders[k];

							delete element.itemsInCart;
							element.itemsInCart = cart.filter((x) => x.id == element._id)[0].data;
							element.staffId = satfCartData.filter((x) => element.budtender == x.staffName)[0]._id;

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
}
