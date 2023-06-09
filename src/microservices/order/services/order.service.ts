import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { Order } from '../entities/order.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OrderService {
	constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

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

			if (data.orders.length > 0) {
				await this.orderModel.insertMany(data.orders);
				console.log(`Seeded ${data.orders.length} orders.`);
			} else {
				console.log('No orders to seed.');
			}
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
}
