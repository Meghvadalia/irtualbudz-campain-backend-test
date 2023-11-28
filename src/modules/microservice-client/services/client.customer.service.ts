import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { Customer } from '../../../microservices/customers/entities/customer.entity';
import { ClientStoreService } from './client.store.service';
import { getCurrentYearDateRange } from 'src/utils/time.utils';
import { dynamicCatchException } from 'src/utils/error.utils';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { Order } from 'src/microservices/order/entities/order.entity';

@Injectable()
export class ClientCustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Order.name) private orderModel: Model<Order>,
		private readonly clientStoreService: ClientStoreService
	) {}

	async getAverageAge(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		try {
			const aggregationPipeline = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
						},
					},
				},
				{
					$lookup: {
						from: DATABASE_COLLECTION.CUSTOMER,
						let: {
							customerId: '$customerId',
						},
						pipeline: [
							{
								$match: {
									$expr: {
										$or: [
											{ $eq: ['$_id', '$$customerId'] },
											{ $eq: ['$posCustomerId', '$$customerId'] },
										],
									},
								},
							},
						],
						as: 'customers',
					},
				},
				{
					$unwind: {
						path: '$customers',
					},
				},
				{
					$group: {
						_id: null,
						averageAge: {
							$avg: {
								$divide: [
									{
										$subtract: [new Date(), '$customers.birthDate'],
									},
									1000 * 60 * 60 * 24 * 365,
								],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						averageAge: {
							$round: ['$averageAge', 0],
						},
					},
				},
			];

			const result = await this.orderModel.aggregate(aggregationPipeline);
			const { averageAge } = result.length > 0 ? result[0] : { averageAge: null };

			return { averageAge };
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getNewCustomersByMonth(storeId: Types.ObjectId) {
		const storeData = await this.clientStoreService.storeById(storeId.toString());
		const { formattedFromDate, formattedToDate } = getCurrentYearDateRange(storeData.timeZone);

		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						userCreatedAt: {
							$gte: formattedFromDate,
							$lte: formattedToDate,
						},
					},
				},
				{
					$group: {
						_id: { $month: '$userCreatedAt' },
						count: { $sum: 1 },
					},
				},
				{ $sort: { _id: 1 } },
				{
					$project: {
						_id: 0,
						month: {
							$let: {
								vars: {
									monthsInString: [
										'January',
										'February',
										'March',
										'April',
										'May',
										'June',
										'July',
										'August',
										'September',
										'October',
										'November',
										'December',
									],
								},
								in: {
									$arrayElemAt: ['$$monthsInString', { $subtract: ['$_id', 1] }],
								},
							},
						},
						count: 1,
					},
				},
			];

			const result = await this.customerModel.aggregate(pipeline);
			const newCustomersByMonth = result.length > 0 ? result : [];

			return { newCustomersByMonth };
		} catch (error) {
			dynamicCatchException(error);
		}
	}
	async getTotalCurrentYearCustomer(storeId: Types.ObjectId) {
		const storeData = await this.clientStoreService.storeById(storeId.toString());
		const { formattedFromDate, formattedToDate } = getCurrentYearDateRange(storeData.timeZone);
		try {
			const result = await this.customerModel.countDocuments({
				storeId: { $in: [new Types.ObjectId(storeId)] },
				userCreatedAt: {
					$gte: formattedFromDate,
					$lte: formattedToDate,
				},
			});
			if (result) {
				return { totalCustomerForCurrentYear: result };
			}
			return { totalCustomerForCurrentYear: 0 };
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getCustomerData(customerIds) {
		const customerData = await this.customerModel
			.find({
				$and: [
					{ _id: { $in: customerIds } },
					{
						email: {
							$ne: null,
							$nin: ['', /^\s*$/],
						},
					},
				],
			})
			.select('name email');
		return customerData;
	}
}
