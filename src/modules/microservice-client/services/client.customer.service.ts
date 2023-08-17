import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Customer } from '../../../microservices/customers/entities/customer.entity';
import { ClientStoreService } from './client.store.service';

@Injectable()
export class ClientCustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		private clientStoreService: ClientStoreService
	) {}

	async getAverageAge(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		const startDateStartTime = fromDate;
		const storeData = await this.clientStoreService.storeById(
			storeId.toString()
		);
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
							$divide: [
								{ $subtract: [new Date(), '$birthDate'] },
								1000 * 60 * 60 * 24 * 365,
							],
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
					averageAge: { $round: ['$averageAge', 0] },
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
			result.length > 0
				? result[0]
				: { averageAge: null, averageAgeGrowth: null };

		return { averageAge, averageAgeGrowth };
	}
}
