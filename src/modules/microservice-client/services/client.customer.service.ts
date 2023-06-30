import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Customer } from '../../../microservices/customers/entities/customer.entity';

@Injectable()
export class ClientCustomerService {
	constructor(@InjectModel(Customer.name) private customerModel: Model<Customer>) {}

	async getAverageAge(storeId: Types.ObjectId, fromDate: string, toDate: string) {
		const fromStartDate = new Date(fromDate);
		const toEndDate = new Date(toDate);
		const aggregationPipeline = [
			{
				$match: {
					storeId,
					createdAt: {
						$gte: fromStartDate,
						$lte: toEndDate,
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
				},
			},
			{
				$project: {
					_id: 0,
					averageAge: { $round: ['$averageAge', 2] },
				},
			},
		];

		const result = await this.customerModel.aggregate(aggregationPipeline);
		const averageAge = result.length > 0 ? result[0].averageAge : null;

		return averageAge;
	}
}
