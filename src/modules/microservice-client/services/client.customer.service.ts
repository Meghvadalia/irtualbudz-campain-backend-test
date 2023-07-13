import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Customer } from '../../../microservices/customers/entities/customer.entity';

@Injectable()
export class ClientCustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>
	) {}

	async getAverageAge(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const startDateStartTime = new Date(fromDate);
		const startDateEndTime = new Date(fromDate);
		const endDateStartTime = new Date(toDate);
		const endDateEndTime = new Date(toDate);

		startDateEndTime.setUTCHours(23, 59, 59, 999);
		endDateStartTime.setUTCHours(0, 0, 0, 0);

		const aggregationPipeline = [
			{
				$match: {
					storeId,
					userCreatedAt: {
						$gte: startDateStartTime,
						$lte: endDateEndTime,
					},
				},
			},
			{
				$group: {
					_id: null,
					averageAge: {
						$avg: {
							$divide: [
								{ $subtract: [new Date(), '$birthDate'] },
								1000 * 60 * 60 * 24 * 365,
							],
						},
					},
					toDateAverageAge: {
						$avg: {
							$cond: [
								{ $gte: ['$userCreatedAt', endDateStartTime] },
								{
									$divide: [
										{
											$subtract: [
												new Date(),
												'$birthDate',
											],
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
								{ $lte: ['$userCreatedAt', startDateEndTime] },
								{
									$divide: [
										{
											$subtract: [
												new Date(),
												'$birthDate',
											],
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
					averageAge: { $round: ['$averageAge', 2] },
					averageAgeGrowth: {
						$round: [
							{
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$toDateAverageAge',
													'$fromDateAverageAge',
												],
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
		const { averageAge, averageAgeGrowth } =
			result.length > 0 ? result[0] : null;

		return { averageAge, averageAgeGrowth };
	}
}
