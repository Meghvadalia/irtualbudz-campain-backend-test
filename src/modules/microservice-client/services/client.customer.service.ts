import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { Customer } from '../../../microservices/customers/entities/customer.entity';
import { ClientStoreService } from './client.store.service';
import { getCurrentYearDateRange } from 'src/utils/time.utils';
import { dynamicCatchException } from 'src/utils/error.utils';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { Order } from 'src/microservices/order/entities/order.entity';
import { IStore } from 'src/model/store/interface/store.inteface';

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
							$gte: new Date(
								new Date(
									new Date(formattedFromDate).setFullYear(new Date().getFullYear() - 1)
								).toISOString()
							),
							$lte: new Date(new Date(formattedFromDate).toISOString()),
						},
					},
				},
				{
					$group: {
						_id: { $month: '$userCreatedAt' },
						count: { $sum: 1 },
					},
				},
				{
					$addFields: {
						month: {
							$let: {
								vars: {
									monthsInString: [
										null,
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
									$arrayElemAt: ['$$monthsInString', '$_id'],
								},
							},
						},
					},
				},
				{
					$addFields: {
						sortOrder: {
							$cond: {
								if: { $gte: ['$_id', new Date().getMonth() + 1] },
								then: { $subtract: ['$_id', new Date().getMonth() + 1] },
								else: { $add: ['$_id', 12 - new Date().getMonth() - 1] },
							},
						},
					},
				},
				{
					$sort: { sortOrder: 1 },
				},
			];
			console.error('newCustomersByMonth');
			console.log(JSON.stringify(pipeline));
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
					$gte: new Date(
						new Date(
							new Date(formattedFromDate).setFullYear(new Date().getFullYear() - 1)
						).toISOString()
					),
					$lte: new Date(new Date(formattedFromDate).toISOString()),
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

	/**
	 * Retrieves customer data based on the provided customer IDs and store object.
	 * @param {number[]} customerIds - An array of customer IDs.
	 * @param {object} storeObject - An optional store object that contains location information.
	 * @returns {Promise<object[]>} - An array of customer objects containing the 'name' and 'email' fields.
	 */
	async getCustomerData(customerIds: string[], storeObject?: IStore): Promise<object[]> {
		const query: any = {
			_id: { $in: customerIds },
			email: { $ne: null, $nin: ['', /^\s*$/] },
		};

		if (storeObject) {
			if (storeObject.location.locationName === 'The Tea House Retail') {
				query.discountGroups = 'VIP';
			}
		}

		const customerData = await this.customerModel.find(query).select('name email');
		return customerData;
	}
}
