import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosRequestConfig } from 'axios';

import { Order } from '../entities/order.entity';
import { Cron } from '@nestjs/schedule';
import { Cart } from '../entities/cart.entity';
import { Staff } from '../entities/staff.entity';
import { IStaff } from '../interfaces/staff.interface';
import { ICompany } from 'src/model/company/interface/company.interface';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { Store } from 'src/model/store/entities/store.entity';
import { IOrder } from '../interfaces/order.interface';
import { CustomerService } from '../../customers/service/customer.service';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
		@InjectModel(Staff.name) private staffModel: Model<Staff>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		private readonly customerService: CustomerService
	) {}

	async seedOrders(startDate: Date, endDate: Date, importId: string) {
		try {
			const { posId, dataObject }: ICompany = await this.companyModel.findOne<ICompany>({
				name: 'Monarc',
			});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: posId,
			});

			console.log('startDate', startDate);
			console.log('endDate', endDate);
			console.log('importId', importId);

			const options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/orders/findByLocationId/${importId}`,
				params: {
					created_after: startDate,
					created_before: endDate,
					page_size: 10000,
				},
				headers: {
					key: dataObject.key,
					ClientId: dataObject.clientId,
					Accept: 'application/json',
				},
			};

			await this.processOrders(options);
		} catch (error) {
			console.error('Error while seeding orders:', error);
			throw error;
		}
	}

	@Cron('0 0 0 * * *')
	async scheduleCronJob() {
		try {
			const currentDate = new Date();
			const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
			const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({ name: 'Monarc' });
			const locationIds = (await this.storeModel.find({ companyId: monarcCompanyData._id })).map(({ location }) => location);

			let counter = 0;
			const intervalDuration = 2000;
			const maxTime = locationIds.length;

			const intervalFunction = async () => {
				if (counter >= maxTime) {
					clearInterval(interval);
					console.log('Loop finished!');
					return;
				}

				console.log('Location ID:', locationIds[counter].locationId);
				const customersCount = await this.orderModel.countDocuments();
				if (customersCount === 0) {
					console.log('Seeding data for the last 100 days...');
					const hundredDaysAgo = new Date(
						currentDate.getFullYear(),
						currentDate.getMonth(),
						currentDate.getDate() - 100,
						0,
						0,
						0
					);
					this.seedOrders(hundredDaysAgo, toDate, locationIds[counter].importId);
				} else {
					console.log('Seeding data from the previous day...');
					this.seedOrders(fromDate, toDate, locationIds[counter].importId);
				}

				counter++;
			};

			const interval = setInterval(intervalFunction, intervalDuration);
		} catch (error) {
			console.error('Error while scheduling cron job:', error);
		}
	}

	async addItemCart(carts: any[], locationId: any, id: any) {
		try {
			const tempArr = carts.map((cart) => this.addSingleData(cart, locationId, id));
			const data = await Promise.all(tempArr);
			return { id, data };
		} catch (error) {
			console.error('Error while adding item to cart:', error);
			throw error;
		}
	}

	async addStaff(element: any) {
		try {
			const staffObject: IStaff = {
				staffName: element.staffName,
				storeId: element.locationId,
			};

			const existingStaff = await this.staffModel.findOne(staffObject);

			if (existingStaff === null) {
				const newStaff = await this.staffModel.create(staffObject);
				return newStaff;
			}

			return existingStaff;
		} catch (error) {
			console.error('Error while adding staff:', error);
			throw error;
		}
	}

	async addSingleData(cart, locationId, id) {
		try {
			const existingCartItem = await this.cartModel.findOne({
				posCartId: cart.id,
				storeId: locationId,
				productName: cart.productName,
			});

			if (existingCartItem === null) {
				const newCartItem = {
					posCartId: cart.id,
					storeId: locationId,
					productName: cart.productName,
				};

				const createdCartItem = await this.cartModel.create(newCartItem);
				return createdCartItem._id;
			}

			return existingCartItem._id;
		} catch (error) {
			console.error('Error while adding single data to cart:', error);
			throw error;
		}
	}

	async addOrder(element: any) {
		try {
			const existingOrder = await this.orderModel.findOne({ posOrderId: element._id });

			if (existingOrder === null) {
				element.posOrderId = element._id;
				element.posCreatedAt = new Date(element.createdAt.toString());
				delete element.createdAt;
				delete element._id;

				const newOrder = await this.orderModel.create(element);
				return newOrder;
			}
		} catch (error) {
			console.error('Error while adding order:', error);
			throw error;
		}
	}

	async processOrders(options) {
		try {
			console.log('====================================');
			console.log('Processing Order Batch');
			console.log('====================================');

			let page = 1;
			let shouldContinue = true;

			while (shouldContinue) {
				options.params.page = page;
				const { data } = await axios.request(options);
				const orderData = data.orders;

				if (orderData.length > 0) {
					this.processOrderBatch(orderData, page);
					page++;
				} else {
					console.log('All orders fetched');
					shouldContinue = false;
				}
			}
		} catch (error) {
			console.error('Error while processing orders:', error);
			throw error;
		}
	}

	async processOrderBatch(orders, page: number) {
		try {
			console.log('====================================');
			console.log('Processing Order Batch number', page);
			console.log('====================================');

			const temp = orders.map((x: IOrder) => ({
				staffName: x.budtender,
				locationId: x.locationId,
				posCreatedAt: new Date(x.createdAt),
				customerId: x.customerId,
			}));

			const customerIds: Set<string> = new Set(temp.map((t) => t.customerId));
			const locationIds: Set<string> = new Set(temp.map((l) => l.locationId));

			const distinctStaff = temp.reduce((accumulator, current) => {
				const existingStaff = accumulator.find(
					(staff) => staff.staffName === current.staffName && staff.locationId === current.locationId
				);
				if (!existingStaff) {
					accumulator.push(current);
				}
				return accumulator;
			}, []);

			const staffCartData = await Promise.all(distinctStaff.map((staff) => this.addStaff(staff)));

			const itemPromises = orders.map((order) => this.addItemCart(order.itemsInCart, order.locationId, order._id));
			const cart = await Promise.all(itemPromises);

			const orderPromises = orders.map((order) => {
				const staffId = staffCartData.find((staff) => staff.staffName === order.budtender)._id;

				const items = cart.find((item) => item.id === order._id).data;

				delete order.itemsInCart;
				order.itemsInCart = items;
				order.staffId = staffId;

				delete order.budtender;
				return this.addOrder(order);
			});

			const processedOrders = await Promise.all(orderPromises);
			locationIds.forEach((locationId) => {
				customerIds.forEach((customerId) => this.customerService.seedCustomers(customerId, locationId));
			});

			console.log('Order Done', processedOrders.length);
		} catch (error) {
			console.error('Error while processing order batch:', error);
			throw error;
		}
	}

	async seedDutchieStaff() {
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

			const tokenOptions = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${dataObject.key}`,
				headers: {
					Accept: 'application/json',
				},
			};

			const { data: token } = await axios.request(tokenOptions);

			const staffOptions: AxiosRequestConfig = {
				url: `${posData.liveUrl}/employees`,
				headers: {
					Accept: 'application/json',
					Authorization: token,
				},
			};

			const { data } = await axios.request(staffOptions);

			let staffArray: IStaff[] = [];

			for (const d of data) {
				staffArray.push({
					staffName: d.fullName,
					storeId: companyId,
				});
			}
			await this.staffModel.insertMany(staffArray);
			console.log(`Seeded ${data.length} employees.`);
		} catch (error) {
			console.error('Failed to seed staff data:', error);
			throw error;
		}
	}
}
