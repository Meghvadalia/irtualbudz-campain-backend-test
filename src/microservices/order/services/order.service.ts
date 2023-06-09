import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { Order } from '../entities/order.entity';
import { Cron } from '@nestjs/schedule';
import { Cart } from '../entities/cart.entity';
import { Staff } from '../entities/staff.entity';
import { IStaff } from '../interfaces/staff.interface';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Cart.name) private cartModal: Model<Cart>,
		@InjectModel(Staff.name) private staffModal: Model<Staff>,
	) { }

	async seedOrders(fromDate: Date, toDate: Date, importId: string) {
		try {

			const options = {
				method: 'get',
				url: `${process.env.FLOWHUB_URL}/v1/orders/findByLocationId/${importId}`,
				params: { created_after: fromDate, created_before: toDate },
				headers: {
					key: process.env.FLOWHUB_KEY,
					ClientId: process.env.FLOWHUB_CLIENT_ID,
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);
			let temp = data.orders.map((x) => ({ staffName: x.budtender, locationId: x.locationId }))
			// remove duplicate object
			let staff = temp.filter((v, i, a) => a.findIndex(v2 => ['staffName', 'locationId'].every(k => v2[k] === v[k])) === i)
			let staffFun = []
			let ItemFunction = []
			/* create function array for promise all 
			 * for loop pass object of order
			 */
			for (let index = 0; index < staff.length; index++) {
				let element = staff[index];
				staffFun.push(this.addStaff(element))
			}
			Promise.all(staffFun)
				.then((satfCartData) => {
					console.log("satfCartData", JSON.stringify(satfCartData))
					for (let index = 0; index < data.orders.length; index++) {
						let element = data.orders[index];
						ItemFunction.push(this.addItemCart(element.itemsInCart, element.locationId));
					}
					let orderArrayFun = []
					Promise.all(ItemFunction).then((cart) => {

						for (let k = 0; k < data.orders.length; k++) {
							let element = data.orders[k];
							element.itemsInCart = cart[k];
							element.staffId = satfCartData.filter((x)=>element.budtender == x.staffName)[0]._id
							delete element.budtender
							orderArrayFun.push(this.addOrder(element))
						}
						Promise.all(orderArrayFun).then((order)=>{
							console.log("Order Done",order.length)
						})
					})
				}).catch((err) => {
					console.log("err :", err)
				})
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

			const options = {
				method: 'get',
				url: `${process.env.FLOWHUB_URL}/v1/clientsLocations`,
				params: { created_after: fromDate, created_before: toDate },
				headers: {
					key: process.env.FLOWHUB_KEY,
					ClientId: process.env.FLOWHUB_CLIENT_ID,
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);
			console.log("Total locations ", data.data.length);
			// Counter to keep track of elapsed time
			let counter = 0;

			// Interval duration in milliseconds
			const intervalDuration = 2000; // 1000 milliseconds = 1 second

			// Maximum time in seconds (2000 seconds)
			const maxTime = data.data.length;

			const intervalFunction = async () => {
				// Check if the elapsed time exceeds the maximum time
				if (counter >= maxTime) {
					// Stop the interval
					clearInterval(interval);
					console.log('Loop finished!');
					return;
				}

				// Code to execute in each interval
				console.log('Interval:', data.data[counter].locationId);
				const customersCount = await this.orderModel.countDocuments();
				if (customersCount === 0) {
					console.log('Seeding data for the last 100 days...');
					const hundredDaysAgo = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 100, 0, 0, 0);
					this.seedOrders(hundredDaysAgo, toDate, data.data[counter].importId);
				} else {
					console.log('Seeding data from the previous day...');
					this.seedOrders(fromDate, toDate, data.data[counter].importId);
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
	addItemCart(carts: any, locationId: any) {
		return new Promise((resolve, reject) => {
			let tempArr = []
			for (let i = 0; i < carts.length; i++) {
				tempArr.push(this.addSingleData(carts[i], locationId))
			}
			Promise.all(tempArr).then((data) => {
				resolve(data.map((x) => x._id))
			})
		})
	}
	/* addStaff function accept object of Staff
	 * and return array of cart ids
	 */
	addStaff(element: any) {
		return new Promise((resolve, reject) => {
			let staffObject:IStaff={
				staffName: element.staffName, storeId: element.locationId
			}
			return this.staffModal.findOne(staffObject).then((res) => {
				if (res == null) {
					return this.staffModal.create(staffObject).then((staffRes) => {
						resolve(staffRes)
					})
				} else {
					resolve(res)
				}
			})
		})
	}

	addSingleData(cart, locationId) {
		return new Promise((resolve, reject) => {
			return this.cartModal.findOne({ posCartId: cart.id, storeId: locationId, productName: cart.productName }).then((res) => {
				if (res == null) {
					cart.posCartId = cart.id;
					cart.storeId = locationId;
					delete cart.id
					try {
						return this.cartModal.create(cart).then((newItem) => {
							resolve(newItem)
						})
					} catch (error) {
						console.log("error", error)
					}

				} else {
					resolve(res)
				}
			})
		})
	}

	/* addStaff function accept object of Staff
	 * and return array of cart ids
	 */
	addOrder(element: any) {
		return new Promise((resolve, reject) => {
			
			return this.orderModel.findOne({ posOrderId: element._id }).then((res) => {
				if (res == null) {
					element.posOrderId = element._id
					delete element._id
					return this.orderModel.create(element).then((orderRes) => {
						resolve(orderRes)
					})
				} else {				
					// console.log("old")
				}
			})
		})
	}
}
