import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { Customer } from '../entities/customer.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { ICustomer } from '../interfaces/customer.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Cron } from '@nestjs/schedule';
import { IPOS } from 'src/model/pos/interface/pos.interface';

@Injectable()
export class CustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>
	) {}

	async seedCustomers(
		customerId: string,
		storeId: string
		// fromDate: Date, toDate: Date
	) {
		try {
			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({
				name: 'Monarc',
			});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: monarcCompanyData.posId,
			});

			const options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/customers/${customerId}`,
				// params: { created_after: fromDate, created_before: toDate },
				headers: {
					key: monarcCompanyData.dataObject.key,
					ClientId: monarcCompanyData.dataObject.clientId,
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);
			data.storeId = storeId;
			data.companyId = monarcCompanyData._id;
			data.POSId = monarcCompanyData.posId;
			data.id = customerId;

			await this.customerModel.create(data);

			// if (data.customers.length > 0) {
			// 	const customers = data.customers.map((customer: ICustomer) => ({
			// 		...customer,
			// 		companyId: monarcCompanyData._id,
			// 		POSId: monarcCompanyData.posId,
			// 	}));

			// 	await this.customerModel.insertMany(customers);
			// console.log(`Seeded ${customers.length} customers.`);
			// } else {
			// 	console.log('No customers to seed.');
			// }
		} catch (error) {
			console.error('Error while seeding customers:', error);
		}
	}

	// @Cron('0 0 0 * * *')
	// async scheduleCronJob() {
	// 	try {
	// 		const currentDate = new Date();
	// 		const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
	// 		const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

	// 		const customersCount = await this.customerModel.countDocuments();
	// 		if (customersCount === 0) {
	// 			console.log('Seeding data for the last 100 days...');
	// 			const hundredDaysAgo = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 100, 0, 0, 0);

	// 			await this.seedCustomers(hundredDaysAgo, toDate);
	// 		} else {
	// 			console.log('Seeding data from the previous day...');
	// 			await this.seedCustomers(fromDate, toDate);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error while scheduling cron job:', error);
	// 	}
	// }
}
