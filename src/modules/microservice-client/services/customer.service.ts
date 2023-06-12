import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Customer } from '../../../microservices/customers/entities/customer.entity';

@Injectable()
export class CustomerService {
	constructor(@InjectModel(Customer.name) private customerModel: Model<Customer>) {}

	async getCustomers() {
		const users = await this.customerModel.find().exec();
		return users;
	}

	async getAverageAge() {
		const aggregationPipeline = [
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
