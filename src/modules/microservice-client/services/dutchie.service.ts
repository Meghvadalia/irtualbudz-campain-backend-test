import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosRequestConfig } from 'axios';
import { Model } from 'mongoose';
import { Customer, CustomerType, ICustomer } from 'src/microservices/customers';
import { IInventory, IProduct, Inventory, Product } from 'src/microservices/inventory';
import { Cart } from 'src/microservices/order/entities/cart.entity';

import { Order } from 'src/microservices/order/entities/order.entity';
import { Staff } from 'src/microservices/order/entities/staff.entity';
import { IStaff } from 'src/microservices/order/interfaces/staff.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Store } from 'src/model/store/entities/store.entity';

@Injectable()
export class DutchieService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Product.name) private productModel: Model<Product>,
		@InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
		@InjectModel(Staff.name) private staffModel: Model<Staff>,
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>
	) {}

	async dutchie() {
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

			return { posId, dataObject, posData, companyId };
		} catch (error) {
			throw new Error('Failed to retrieve data from the database.');
		}
	}

	async generateToken(posData, dataObject) {
		try {
			const options = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${dataObject.key}`,
				headers: {
					Accept: 'application/json',
				},
			};

			const { data } = await axios.request(options);
			return data;
		} catch (error) {
			throw new Error('Failed to generate token.');
		}
	}

	async makeRequest(url: string, token: string) {
		try {
			const options: AxiosRequestConfig = {
				method: 'get',
				url,
				headers: {
					Accept: 'application/json',
					Authorization: token,
				},
			};

			const { data } = await axios.request(options);
			return data;
		} catch (error) {
			throw new Error(`Failed to make a request to ${url}`);
		}
	}
}
