import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { Order } from '../entities/order.entity';
import { Cron } from '@nestjs/schedule';
import { Cart } from '../entities/cart.entity';
import { Staff } from '../entities/staff.entity';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Cart.name) private cartModal: Model<Cart>,
		@InjectModel(Staff.name) private staffModal: Model<Staff>,
	) {}

	async seedOrders(fromDate: Date, toDate: Date) {
		try {
			const options = {
				method: 'get',
				url: `${process.env.FLOWHUB_URL}/v1/orders/findByLocationId/Ao4QyaEGBMqRoTpg5`,
				params: { created_after: fromDate, created_before: toDate },
				headers: {
					key: process.env.FLOWHUB_KEY,
					ClientId: process.env.FLOWHUB_CLIENT_ID,
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);
			let temp = data.orders.map((x)=> ({staffName:x.budtender,locationId:x.locationId}))
			console.log("Sgr",data.orders[0])
			// // remove duplicate object
			let staff = temp.filter((v,i,a)=>a.findIndex(v2=>['staffName','locationId'].every(k=>v2[k] ===v[k]))===i)
			this.staffModal.insertMany(staff);
			let itemAndStaffFun = []
			for (let index = 0; index < data.orders.length; index++) {
				let element = data.orders[index];
				// console.log(JSON.stringify(element))
				itemAndStaffFun.push(this.addStaffData(element))
			}
			Promise.all(itemAndStaffFun)
			.then((satfCartData)=>{
				console.log("res :",JSON.stringify(satfCartData))
				for (let i = 0; i < data.orders.length; i++) {
					data.orders[i].staffId = satfCartData[i].staff
					data.orders[i].itemsInCart = satfCartData[i].cart
					delete data.orders[i].budtender
				}
				this.orderModel.insertMany(data.orders);
			}).catch((err)=>{
				console.log("err :",err)
			})

			// if (data.orders.length > 0) {
			// 	await this.orderModel.insertMany(data.orders);
			// 	console.log(`Seeded ${data.orders.length} orders.`);
			// 	let cartData = data.orders.filter((x)=>x.itemsInCart)
			// 	console.log(JSON.stringify(cartData))


			// 	await this.cartModal.insertMany(cartData);
			// 	console.log(`Seeded ${cartData.length} cart.`);
			// } else {
			// 	console.log('No orders to seed.');
			// }
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

			const customersCount = await this.orderModel.countDocuments();
			if (customersCount === 0) {
				console.log('Seeding data for the last 100 days...');
				const hundredDaysAgo = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 100, 0, 0, 0);

				await this.seedOrders(hundredDaysAgo, toDate);
			} else {
				console.log('Seeding data from the previous day...');
				await this.seedOrders(fromDate, toDate);
			}
		} catch (error) {
			console.error('Error while scheduling cron job:', error);
		}
	}

	addStaffData(element:any) {
		return new Promise((resolve,reject)=>{
			// this.orderModel.findOne(staffData)
			// .then((res)=>{
			// 	resolve(res)
			// })
			// .catch((err)=>{
			// 	console.log("error :",err)
			// 	reject(err)
			// })
			return this.staffModal.findOne({staffName:element.budtender,locationId:element.locationId }).then((res)=>{
				if(res == null){
					console.log("new")
					return this.staffModal.create({staffName:element.budtender,locationId:element.locationId }).then((staffRes)=>{
						return this.cartModal.insertMany(element.itemsInCart).then((itemRes)=>{
							resolve({staff:staffRes,cart:itemRes})
						})
					})
				}else{
					console.log("old",res._id)
					return this.cartModal.insertMany(element.itemsInCart).then((itemRes)=>{
						resolve({staff:res._id,cart:itemRes.map(x=>x._id)})
					})
				}
			})
			
		})
	}
}
