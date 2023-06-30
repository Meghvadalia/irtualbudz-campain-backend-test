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

	async seedCustomers(customerId: string, storeId: string) {
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
				headers: {
					key: monarcCompanyData.dataObject.key,
					ClientId: monarcCompanyData.dataObject.clientId,
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);

			const customer: ICustomer = {
				posCustomerId: data.customer.id,
				storeId,
				companyId: monarcCompanyData._id,
				POSId: monarcCompanyData.posId,
				name: data.customer.name,
				email: data.customer.email,
				phone: data.customer.phone,
				city: data.customer.city,
				state: data.customer.state,
				country: data.customer.country,
				birthDate: data.customer.birthDate,
				isLoyal: data.customer.isLoyal,
				loyaltyPoints: data.customer.loyaltyPoints,
				streetAddress1: data.customer.streetAddress1,
				streetAddress2: data.customer.streetAddress2,
				type: data.customer.type,
				zip: data.customer.zip,
			};

			await this.customerModel.create(customer);
		} catch (error) {
			console.error('Error while seeding customers:', error.message);
		}
	}

	async seedDutchieCustomers() {
		try {
			const {
				posId,
				dataObject,
				_id: companyId,
			}: ICompany = await this.companyModel.findOne<ICompany>({
				name: 'Virtual Budz',
			});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: posId,
			});

			const customer = await this.customerModel.findOne({ companyId });

			const tokenOptions = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${dataObject.key}`,
				headers: {
					Accept: 'application/json',
				},
			};

			const { data: token } = await axios.request(tokenOptions);

			const date = new Date();
			let fromDate: Date, toDate: Date;

			if (customer) {
				fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0);
				toDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
				console.log('seeding data for previous day');
			} else {
				fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 100, 0, 0, 0);
				toDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
				console.log('seeding data for last 100 day');
			}
			const customerOptions: AxiosRequestConfig = {
				url: `${
					posData.liveUrl
				}/customer/customers?fromLastModifiedDateUTC=${fromDate.toISOString()}&toLastModifiedDateUTC=${toDate.toISOString()}&includeAnonymous=true`,
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
					POSId: posId,
					companyId,
					loyaltyPoints: 0,
					country: '',
				});

			await this.customerModel.insertMany(customersArray);
			console.log(`Seeded ${data.length} customers.`);
		} catch (error) {
			console.error('Failed to seed customers:', error);
		}
	}
}
