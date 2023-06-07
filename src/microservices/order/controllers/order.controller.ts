import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import axios from 'axios';
import { Order } from '../entities/order.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';

@Controller('orders')
export class OrderController {
	constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

	@GrpcMethod('OrderService', 'getOrder')
	getOrder(data: any): any {
		try {
			console.log('get Method Called', data);
			return { surname: 78 };
		} catch (error) {
			console.log('GRPC METHOD', error);
		}
	}

	@Cron('0 0 * * * *', {
		timeZone: 'Asia/Kolkata',
	})
	async seedOrders(): Promise<void> {
		try {
			const options = {
				method: 'get',
				url: `${process.env.FLOWHUB_URL}/v1/orders/findByLocationId/Ao4QyaEGBMqRoTpg5`,
				headers: {
					key: process.env.FLOWHUB_KEY,
					ClientId: process.env.FLOWHUB_CLIENT_ID,
					Accept: 'application/json',
				},
			};
			try {
				const { data } = await axios.request(options);
				const orderDataArray = data.orders;

				for (const orderData of orderDataArray) {
					await this.orderModel.create({ ...orderData });
				}
			} catch (error) {
				console.error(error);
			}
		} catch (error) {
			console.log('GRPC METHOD', error);
		}
	}
}
