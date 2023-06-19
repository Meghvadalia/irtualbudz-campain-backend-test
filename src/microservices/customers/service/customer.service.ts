import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { Customer } from '../entities/customer.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { ICustomer } from '../interfaces/customer.interface';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { POS } from 'src/model/pos/entities/pos.entity';

@Injectable()
export class CustomerService {
	constructor(
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>
	) {}

	async seedCustomers(customerId: string, storeId: string) {
		try {
			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({ name: 'Monarc' });
			const posData: IPOS = await this.posModel.findOne<IPOS>({ _id: monarcCompanyData.posId });

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
			await this.addCustomer(data, customerId, storeId, monarcCompanyData._id, monarcCompanyData.posId);
		} catch (error) {
			console.error('Error while seeding customers:', error);
		}
	}

	async findCustomer(id: string) {
		return this.customerModel.findOne({ id });
	}

	async addCustomer(customerData: ICustomer, customerId: string, storeId: string, companyId: string, posId: string) {
		const updatedCustomerData = {
			...customerData,
			id: customerId,
			POSId: posId,
			storeId,
			companyId,
		};

		await this.customerModel.create(updatedCustomerData);
	}
}
