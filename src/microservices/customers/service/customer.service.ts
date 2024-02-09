import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosRequestConfig } from 'axios';

import { Customer } from '../entities/customer.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { CustomerType, ICustomer } from '../interfaces/customer.interface';
import { dynamicCatchException } from 'src/utils/error.utils';

@Injectable()
export class CustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>
	) {}

	async seedCustomers(posData: IPOS, company: any) {
		try {
			console.log('customer', company, posData);
			const customer = await this.customerModel.findOne({
				companyId: company.companyId,
			});
			this.seedData(customer, posData, company);
		} catch (error) {
			console.error('Error while seeding customers:', error);
			dynamicCatchException(error);
		}
	}

	async seedData(customer, posData, company) {
		let fromDate, toDate;
		let options: AxiosRequestConfig;
		const customerDataArray: ICustomer[] = [];
		const date = new Date();

		// for (const company of companiesList) {
		let page = 1;
		let shouldContinue = true;
		if (customer) {
			fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0)
				.toISOString()
				.split('T')[0];
			toDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
				.toISOString()
				.split('T')[0];
			console.log('Seeding data for the previous day');
			options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/customers?created_after=${fromDate}&created_before=${toDate}&page=${page}&page_size=10000`,
				headers: {
					key: company.key,
					ClientId: company.clientId,
					Accept: 'application/json',
				},
			};
		} else {
			console.log('Seeding all customers...');
			options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/customers?page=${page}&page_size=10000`,
				headers: {
					key: company.key,
					ClientId: company.clientId,
					Accept: 'application/json',
				},
			};
		}

		while (shouldContinue) {
			const { data } = await axios.request(options);
			const customerData = data.customers ? data.customers : data.data;
			console.log('====================================');
			console.log(
				'Data syncing for customer for company ' + company.name + ' ' + customerData.length
			);
			console.log('====================================');
			if (customerData.length > 0) {
				const bulkOps = customerData.map((customer) => ({
					updateOne: {
						filter: {
							posCustomerId: customer.id ?? customer.id,
							companyId: company._id,
						},
						update: {
							$set: {
								posCustomerId: customer.id ?? customer.id,
								companyId: company._id,
								POSId: posData._id,
								name: customer.name,
								email: customer.email,
								phone: customer.phone,
								city: customer.city,
								state: customer.state,
								country: customer.country,
								birthDate: customer.birthDate,
								isLoyal: customer.isLoyal,
								loyaltyPoints: customer.loyaltyPoints,
								streetAddress1: customer.streetAddress1,
								streetAddress2: customer.streetAddress2,
								type: customer.type,
								zip: customer.zip,
								userCreatedAt: customer.createdAt,
							},
						},
						upsert: true,
					},
				}));
				if (bulkOps.length > 0) {
					try {
						this.customerModel.bulkWrite(bulkOps, { ordered: false });
					} catch (error) {
						console.log('error', error);
					}
				}
				page++;
				if (customer) {
					options.url = `${posData.liveUrl}/v1/customers?created_after=${fromDate}&created_before=${toDate}&page=${page}&page_size=10000`;
				} else {
					options.url = `${posData.liveUrl}/v1/customers?page=${page}&page_size=10000`;
				}
			} else {
				console.log('All customers fetched');
				shouldContinue = false;
			}
		}
	}

	// async calculateAge(birthDate: Date) {
	// 	const today = new Date();
	// 	const birthDateObj = new Date(birthDate);

	// 	let age = today.getFullYear() - birthDateObj.getFullYear();
	// 	const monthDiff = today.getMonth() - birthDateObj.getMonth();

	// 	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
	// 		age--;
	// 	}

	// 	return age;
	// }

	async seedDutchieCustomers(posData: IPOS, company: any) {
		console.log('seedDutchieCustomers ====>');
		try {
			const tokenOptions = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${company.key}`,
				headers: {
					Accept: 'application/json',
				},
			};

			const { data: token } = await axios.request(tokenOptions);

			const customerOptions: AxiosRequestConfig = {
				url: `${posData.liveUrl}/customer/customers?&includeAnonymous=true`,
				headers: {
					Accept: 'application/json',
					Authorization: token,
				},
			};

			const { data } = await axios.request(customerOptions);

			const bulkOps = data.map((customer) => ({
				updateOne: {
					filter: { posCustomerId: customer.customerId },
					update: {
						$setOnInsert: {
							birthDate: customer.dateOfBirth,
							city: customer.city,
							email: customer.emailAddress,
							posCustomerId: customer.customerId,
							name: customer.name,
							phone: customer.phone,
							isLoyal: customer.isLoyaltyMember,
							state: customer.state,
							streetAddress1: customer.address1,
							streetAddress2: customer.address2,
							zip: customer.postalCode,
							type:
								customer.customerType === 'Recreational'
									? CustomerType.recCustomer
									: CustomerType.medCustomer,
							POSId: posData._id,
							companyId: company.companyId,
							loyaltyPoints: 0,
							country: '',
							userCreatedAt: customer.creationDate,
						},
					},
					upsert: true,
				},
			}));

			await this.customerModel.bulkWrite(bulkOps);

			console.log(`Seeded ${data.length} customers.`);
		} catch (error) {
			console.error('Failed to seed customers:');
			console.error(error.message);
			dynamicCatchException(error);
		}
	}
}
