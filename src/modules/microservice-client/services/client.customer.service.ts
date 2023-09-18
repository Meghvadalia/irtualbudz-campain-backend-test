import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { Customer } from '../../../microservices/customers/entities/customer.entity';
import { ClientStoreService } from './client.store.service';
import { getCurrentYearDateRange } from 'src/utils/time.utils';
import { dynamicCatchException } from 'src/utils/error.utils';

@Injectable()
export class ClientCustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		private clientStoreService: ClientStoreService
	) {}

	async getAverageAge(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		try {
			const startDateStartTime = fromDate;
			const storeData = await this.clientStoreService.storeById(storeId.toString());
			const endDateEndTime = toDate;
			const aggregationPipeline = [
				{
					$match: {
						storeId: { $in: [storeId] },
						userCreatedAt: {
							$gte: startDateStartTime,
							$lte: endDateEndTime,
						},
					},
				},
				{
					$addFields: {
						userCreatedAtLocal: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$userCreatedAt',
								timezone: storeData.timeZone,
							},
						},
					},
				},
				{
					$group: {
						_id: null,
						averageAge: {
							$avg: {
								$divide: [{ $subtract: [new Date(), '$birthDate'] }, 1000 * 60 * 60 * 24 * 365],
							},
						},
						toDateAverageAge: {
							$avg: {
								$cond: [
									{
										$eq: [
											'$userCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: startDateStartTime,
													timezone: storeData.timeZone,
												},
											},
										],
									},
									{
										$divide: [
											{
												$subtract: [new Date(), '$birthDate'],
											},
											1000 * 60 * 60 * 24 * 365,
										],
									},
									null,
								],
							},
						},
						fromDateAverageAge: {
							$avg: {
								$cond: [
									{
										$eq: [
											'$userCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: endDateEndTime,
													timezone: storeData.timeZone,
												},
											},
										],
									},
									{
										$divide: [
											{
												$subtract: [new Date(), '$birthDate'],
											},
											1000 * 60 * 60 * 24 * 365,
										],
									},
									null,
								],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						averageAge: { $round: ['$averageAge', 0] },
						averageAgeGrowth: {
							$round: [
								{
									$multiply: [
										{
											$divide: [
												{
													$subtract: ['$toDateAverageAge', '$fromDateAverageAge'],
												},
												'$fromDateAverageAge',
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

			const result = await this.customerModel.aggregate(aggregationPipeline);
			const { averageAge, averageAgeGrowth } = result.length > 0 ? result[0] : { averageAge: null, averageAgeGrowth: null };

			return { averageAge, averageAgeGrowth };
		} catch (error) {
			dynamicCatchException(error)
		}
		
	}

	async getNewCustomersByMonth(storeId: Types.ObjectId) {
		const storeData = await this.clientStoreService.storeById(storeId.toString());
		const { formattedFromDate, formattedToDate } = getCurrentYearDateRange(storeData.timeZone);
		console.log(formattedFromDate, formattedToDate);

		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId: { $in: [new Types.ObjectId(storeId)] },
						userCreatedAt: {
							$gte: formattedFromDate,
							$lte: formattedToDate,
						},
					},
				},
				{
					$group: {
						_id: { $month: '$userCreatedAt' }, // Group by month of creation
						count: { $sum: 1 }, // Count the number of users in each group
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
			dynamicCatchException(error)
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
			dynamicCatchException(error)
		}
	}
}
