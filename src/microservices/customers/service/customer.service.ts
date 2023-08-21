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

@Injectable()
export class CustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>
	) {}

	async seedCustomers(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne({ name: posName });
			const companiesList: ICompany[] = await this.companyModel.find<ICompany>({
				isActive: true,
				posId: posData._id,
			});

			const date = new Date();
			let fromDate, toDate;
			let options: AxiosRequestConfig;
			let customerDataArray: ICustomer[] = [];

			for (const company of companiesList) {
				let page = 1;
				let shouldContinue = true;
				let customerData;

				const customer = await this.customerModel.findOne({ companyId: company._id });

				if (customer) {
					fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0).toISOString().split('T')[0];
					toDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString().split('T')[0];
					console.log('Seeding data for the previous day');
					options = {
						method: 'get',
						url: `${posData.liveUrl}/v1/customers?created_after=${fromDate}&created_before=${toDate}&page=${page}&page_size=10000`,
						headers: {
							key: company.dataObject.key,
							ClientId: company.dataObject.clientId,
							Accept: 'application/json',
						},
					};
				} else {
					console.log('Seeding all customers...');
					options = {
						method: 'get',
						url: `${posData.liveUrl}/v1/customers?page=${page}&page_size=10000`,
						headers: {
							key: company.dataObject.key,
							ClientId: company.dataObject.clientId,
							Accept: 'application/json',
						},
					};
				}

				while (shouldContinue) {
					const { data } = await axios.request(options);
					if (company.name === 'Monarc') {
						customerData = data.customers;
					} else {
						customerData = data.data;
					}
					for (const d of customerData) {
						customerDataArray.push({
							posCustomerId: d.id ?? d.id,
							companyId: company._id,
							POSId: posData._id,
							name: d.name,
							email: d.email,
							phone: d.phone,
							city: d.city,
							state: d.state,
							country: d.country,
							birthDate: d.birthDate,
							isLoyal: d.isLoyal,
							loyaltyPoints: d.loyaltyPoints,
							streetAddress1: d.streetAddress1,
							streetAddress2: d.streetAddress2,
							type: d.type,
							zip: d.zip,
							userCreatedAt: d.createdAt,
						});
					}

					if (customerData.length > 0) {
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

			return Promise.all(await this.customerModel.insertMany(customerDataArray));
		} catch (error) {
			console.error('Error while seeding customers:', error.message);
		}
	}

	async seedDutchieCustomers(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne<IPOS>({
				name: posName,
			});

			const companyData = await this.companyModel.find<ICompany>({
				posId: posData._id,
				isActive: true,
			});

			for (const company of companyData) {
				const tokenOptions = {
					method: 'get',
					url: `${posData.liveUrl}/util/AuthorizationHeader/${company.dataObject.key}`,
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

				const customersArray: ICustomer[] = [];

				for (let d of data)
					customersArray.push({
						birthDate: d.dateOfBirth,
						city: d.city,
						email: d.emailAddress,
						posCustomerId: d.customerId,
						name: d.name,
						phone: d.phone,
						isLoyal: d.isLoyaltyMember,
						state: d.state,
						streetAddress1: d.address1,
						streetAddress2: d.address2,
						zip: d.postalCode,
						type: d.customerType === 'Recreational' ? CustomerType.recCustomer : CustomerType.medCustomer,
						POSId: posData._id,
						companyId: company._id,
						loyaltyPoints: 0,
						country: '',
						userCreatedAt: d.creationDate,
					});

				await this.customerModel.insertMany(customersArray);
				console.log(`Seeded ${data.length} customers.`);
			}
		} catch (error) {
			console.error('Failed to seed customers:', error.message);
		}
	}
}
