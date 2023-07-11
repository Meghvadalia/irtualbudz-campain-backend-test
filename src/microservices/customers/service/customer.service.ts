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
	private cachedCompanyId: string;
	private cachedCompanyData: ICompany;
	private cachedPOSData: IPOS;

	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>
	) {}

	async seedCustomers(customerId: string, storeId: string, companyId: string) {
		try {
			let companyData: ICompany;
			let posData: IPOS;

			if (companyId === this.cachedCompanyId) {
				companyData = this.cachedCompanyData;
				posData = this.cachedPOSData;
			} else {
				companyData = await this.companyModel.findById<ICompany>(companyId.toString());
				posData = await this.posModel.findById<IPOS>(companyData.posId);

				this.cachedCompanyId = companyId;
				this.cachedCompanyData = companyData;
				this.cachedPOSData = posData;
			}

			const options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/customers/${customerId}`,
				headers: {
					key: companyData.dataObject.key,
					ClientId: companyData.dataObject.clientId,
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);

			let customerData;

			if (companyData.name === 'Monarc') {
				customerData = data.customer;
			} else if (companyData.name === 'Zen Barn Farms') {
				customerData = data.data;
			}

			const customer: ICustomer = {
				posCustomerId: customerData.id ? customerData.id : customerId,
				storeId,
				companyId: companyData._id,
				POSId: companyData.posId,
				name: customerData.name,
				email: customerData.email,
				phone: customerData.phone,
				city: customerData.city,
				state: customerData.state,
				country: customerData.country,
				birthDate: customerData.birthDate,
				isLoyal: customerData.isLoyal,
				loyaltyPoints: customerData.loyaltyPoints,
				streetAddress1: customerData.streetAddress1,
				streetAddress2: customerData.streetAddress2,
				type: customerData.type,
				zip: customerData.zip,
				userCreatedAt: customerData.createdAt,
			};
			return await this.customerModel.create(customer);
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

				const date = new Date();
				const customer = await this.customerModel.findOne({ companyId: company._id });

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
