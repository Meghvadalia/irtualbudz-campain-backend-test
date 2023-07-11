import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosRequestConfig } from 'axios';

import { Order } from '../entities/order.entity';
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
import { IStore } from 'src/model/store/interface/store.inteface';
import { ItemsCart } from '../interfaces/cart.interface';
import { Customer } from 'src/microservices/customers';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
		@InjectModel(Staff.name) private staffModel: Model<Staff>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		private readonly customerService: CustomerService
	) {}

	async scheduleCronJob(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne({ name: posName });
			const flowhubCompaniesList: ICompany[] = await this.companyModel.find<ICompany>({
				isActive: true,
				posId: posData._id,
			});

			let fromDate: string;

			const currentDate = new Date();
			fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0)
				.toISOString()
				.split('T')[0];
			const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0)
				.toISOString()
				.split('T')[0];

			const combinedArray = [];
			for (let i = 0; i < flowhubCompaniesList.length; i++) {
				const companyData = flowhubCompaniesList[i];
				const storeList = await this.storeModel.find({ companyId: companyData._id });

				for (let j = 0; j < storeList.length; j++) {
					const storeData = storeList[j];
					combinedArray.push({
						companyId: companyData._id,
						key: companyData.dataObject.key,
						clientId: companyData.dataObject.clientId,
						location: storeData.location,
						_id: storeData._id,
						lastSyncDataDuration: companyData.lastSyncDataDuration,
					});
				}
			}

			const intervalDuration = 2000;

			const processStoreData = async (storeData) => {
				const { key, clientId, location, _id, companyId } = storeData;

				const ordersCount = await this.orderModel.countDocuments({
					storeId: _id,
				});
				if (ordersCount === 0) {
					fromDate = new Date(
						currentDate.getFullYear(),
						currentDate.getMonth(),
						currentDate.getDate() - storeData.lastSyncDataDuration,
						0,
						0,
						0
					)
						.toISOString()
						.split('T')[0];
					await this.seedOrders(fromDate, toDate, key, clientId, location.importId, posName, companyId);
				} else {
					await this.seedOrders(fromDate, toDate, key, clientId, location.importId, posName, companyId);
				}
			};

			const processStoresSequentially = async () => {
				for (let i = 0; i < combinedArray.length; i++) {
					await processStoreData(combinedArray[i]);
					await new Promise((resolve) => setTimeout(resolve, intervalDuration));
				}

				console.log('All stores processed');
			};

			await processStoresSequentially();
		} catch (error) {
			console.error('Error while scheduling cron job:', error.message);
		}
	}

	async seedOrders(
		startDate: string,
		endDate: string,
		key: string,
		clientId: string,
		importId: string,
		posName: string,
		companyId: string
	) {
		try {
			const posData: IPOS = await this.posModel.findOne<IPOS>({
				name: posName,
			});

			const storeData = await this.storeModel.findOne({
				'location.importId': importId,
			});

			const options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/orders/findByLocationId/${importId}`,
				params: {
					created_after: startDate,
					created_before: endDate,
					page_size: 10000,
				},
				headers: {
					key,
					ClientId: clientId,
					Accept: 'application/json',
				},
			};

			await this.processOrders(options, posData._id, companyId, storeData._id as string);
		} catch (error) {
			console.error('Error while seeding orders: ', error.message);
			throw error;
		}
	}

	async addItemsToCart(carts: ItemsCart[], storeId: string, id: string) {
		try {
			const tempArr = carts.map((cart) => this.addSingleData(cart, storeId));
			const data = await Promise.all(tempArr);
			return { id, data };
		} catch (error) {
			console.error('Error while adding item to cart:', error.message);
			throw error;
		}
	}

	async addStaff(element: any, storeId: string) {
		try {
			const staffObject: IStaff = {
				staffName: element.staffName,
				storeId,
			};

			const existingStaff = await this.staffModel.findOne(staffObject);

			if (existingStaff === null) {
				const newStaff = await this.staffModel.create(staffObject);
				return newStaff;
			}

			return existingStaff;
		} catch (error) {
			console.error('Error while adding staff:', error.message);
			throw error;
		}
	}

	async addSingleData(cart: ItemsCart, storeId: string) {
		try {
			const existingCartItem = await this.cartModel.findOne({
				posCartId: cart.id,
				storeId,
				productName: cart.productName,
			});

			if (existingCartItem === null) {
				const newCartItem = {
					...cart,
					posCartId: cart.id,
					storeId,
				};

				const createdCartItem = await this.cartModel.create(newCartItem);
				return createdCartItem._id;
			}

			return existingCartItem._id;
		} catch (error) {
			console.error('Error while adding single data to cart:', error.message);
			throw error;
		}
	}

	async addOrder(element: any, posId: string, companyId: string, storeId: string) {
		try {
			const existingOrder = await this.orderModel.findOne({ posOrderId: element._id });

			if (existingOrder === null) {
				element.posOrderId = element._id ? element._id : element.id;
				element.posCreatedAt = new Date(element.createdAt.toString());
				element.companyId = companyId;
				element.posId = posId;
				element.storeId = storeId;

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

	async processOrders(options, posId: string, companyId: string, storeId: string) {
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
					this.processOrderBatch(orderData, page, posId, companyId, storeId);
					page++;
				} else {
					console.log('All orders fetched');
					shouldContinue = false;
				}
			}
		} catch (error) {
			console.error('Error while processing orders:', error.message);
			throw error;
		}
	}

	async processOrderBatch(orders: IOrder, page: number, posId: string, companyId: string, storeId: string) {
		try {
			console.log('====================================');
			console.log('Processing Order Batch number', page);
			console.log('====================================');

			const temp = orders.map((x: IOrder) => ({
				staffName: x.budtender,
				posCreatedAt: new Date(x.createdAt),
				customerId: x.customerId,
			}));

			const customerIds: Set<string> = new Set(temp.map((t) => t.customerId));
			console.log('Cutomer Id size => ', customerIds.size);

			const distinctStaff = temp.reduce((accumulator, current) => {
				const existingStaff = accumulator.find(
					(staff) => staff.staffName === current.staffName && staff.locationId === current.locationId
				);
				if (!existingStaff) {
					accumulator.push(current);
				}
				return accumulator;
			}, []);

			const staffData = await Promise.all(distinctStaff.map((staff: IStaff) => this.addStaff(staff, storeId)));

			const itemPromises = orders.map((order) => this.addItemsToCart(order.itemsInCart, storeId, order._id));
			const cart = await Promise.all(itemPromises);

			const customerPromises = Array.from(customerIds).map(async (customerId) => {
				return await this.customerService.seedCustomers(customerId, storeId, companyId);
			});
			await Promise.all(customerPromises);

			const orderPromises = orders.map(async (order) => {
				const staffId = staffData.find((staff) => staff.staffName === order.budtender)._id;

				const items = cart.find((item) => item.id === order._id).data;

				delete order.itemsInCart;
				order.itemsInCart = items;
				order.staffId = staffId;

				delete order.budtender;

				const customer = await this.customerModel.findOne({ posCustomerId: order.customerId });
				if (customer) {
					order.customerId = customer._id;
					const newOrder = await this.addOrder(order, posId, companyId, storeId);
					return newOrder;
				}
			});

			const processedOrders = await Promise.all(orderPromises);
			return processedOrders;
		} catch (error) {
			console.error('Error while processing order batch:', error.message);
			throw error;
		}
	}

	// async seedDutchieOrders(posName: string) {
	// 	const posData: IPOS = await this.posModel.findOne<IPOS>({
	// 		name: posName,
	// 	});

	// 	const companyData = await this.companyModel.find<ICompany>({
	// 		posId: posData._id,
	// 		isActive: true,
	// 	});

	// 	let currentDate: Date = new Date(),
	// 		fromDate: Date,
	// 		toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

	// 	for (const company of companyData) {
	// 		const tokenOptions = {
	// 			method: 'get',
	// 			url: `${posData.liveUrl}/util/AuthorizationHeader/${company.dataObject.key}`,
	// 			headers: {
	// 				Accept: 'application/json',
	// 			},
	// 		};

	// 		const { data: token } = await axios.request(tokenOptions);
	// 		const orderData: IOrder = await this.orderModel.findOne({
	// 			companyId: company._id,
	// 		});

	// 		let orderOptions: AxiosRequestConfig;

	// 		if (!orderData) {
	// 			fromDate = new Date(
	// 				currentDate.getFullYear(),
	// 				currentDate.getMonth(),
	// 				currentDate.getDate() - company.lastSyncDataDuration,
	// 				0,
	// 				0,
	// 				0
	// 			);

	// 			orderOptions = {
	// 				url: `${posData.liveUrl}/reporting/transactions?FromLastModifiedDateUTC=${fromDate}&ToLastModifiedDateUTC=${toDate}&IncludeDetail=true&IncludeTaxes=true&IncludeOrderIds=true`,
	// 				headers: {
	// 					Accept: 'application/json',
	// 					Authorization: token,
	// 				},
	// 			};
	// 		} else {
	// 			fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
	// 			orderOptions = {
	// 				url: `${posData.liveUrl}/reporting/transactions?FromLastModifiedDateUTC=${fromDate}&ToLastModifiedDateUTC=${toDate}&IncludeDetail=true&IncludeTaxes=true&IncludeOrderIds=true&IncludeFeesAndDonations=true`,
	// 				headers: {
	// 					Accept: 'application/json',
	// 					Authorization: token,
	// 				},
	// 			};
	// 		}

	// 		const { data } = await axios.request(orderOptions);

	// 		let ordersArray: IOrder[] = [];

	// 		for (const d of data) {
	// 			ordersArray.push({
	// 				companyId: company._id,
	// 				posId: posData._id,
	// 				posOrderId: d.transactionId,
	// 				customerId: d.customerId,
	// 				fullName: d.completedByUser,
	// 				customerType: d.customerTypeId === 2 ? CustomerType.recCustomer : CustomerType.medCustomer,
	// 				orderType: d.orderType,
	// 				voided: d.isVoid,
	// 				storeId: company._id,
	// 				orderStatus: 'sold',
	// 				totals: {
	// 					finalTotal: d.total,
	// 					subTotal: d.subtotal,
	// 					totalDiscounts: d.totalDiscount,
	// 					totalTaxes: d.tax,
	// 					totalFees: 0,
	// 				},
	// 				posCreatedAt: d.transactionDate,
	// 				payments: {},
	// 				currentPoints: d.loyaltyEarned,
	// 				name: '',

	// 			});
	// 		}
	// 	}
	// }

	async seedDutchieStaff(posName: string) {
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

				const staffOptions: AxiosRequestConfig = {
					url: `${posData.liveUrl}/employees`,
					headers: {
						Accept: 'application/json',
						Authorization: token,
					},
				};

				const { data } = await axios.request(staffOptions);

				const storeData: IStore = await this.storeModel.findOne({
					companyId: company._id,
				});
				let staffArray: IStaff[] = [];

				for (const d of data) {
					const staffExists = await this.staffModel.findOne({
						staffName: d.fullName,
						storeId: storeData._id,
					});
					if (staffExists) return;
					staffArray.push({
						staffName: d.fullName,
						storeId: storeData._id,
					});
				}

				const insertEmployee = await this.staffModel.insertMany(staffArray);
				console.log(`Seeded ${insertEmployee.length} employees.`);
			}
		} catch (error) {
			console.error('Failed to seed staff data:', error.message);
			throw error;
		}
	}
}
