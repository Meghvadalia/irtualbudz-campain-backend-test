import { Injectable } from '@nestjs/common';
import { InjectModel, Schema } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
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
import { IStore } from 'src/model/store/interface/store.inteface';
import { AudienceName } from 'src/common/constants';
import { AudienceCustomer } from 'src/modules/microservice-client/entities/audienceCustomers.entity';
import { AudienceDetailsService } from 'src/modules/microservice-client/services/client.audienceDetail.service';
import { ItemDiscounts, ItemsCart, Tax } from '../interfaces/cart.interface';
import { Customer, CustomerService } from 'src/microservices/customers';
import { Product } from 'src/microservices/inventory';
import { CUSTOMER_TYPE, orderType } from '../constant/order.constant';
import * as _ from 'lodash';
import {
	ICartItemFlowhub,
	IOrderFlowHubInterface,
	ITaxFlowhub,
	IDutchieOrderInterface,
} from 'src/common/interface';

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
		@InjectModel(AudienceCustomer.name)
		private audienceCustomerModel: Model<AudienceCustomer>,
		private readonly audienceDetailsService: AudienceDetailsService,
		@InjectModel(Product.name) private productModel: Model<Product>,
		private readonly customerService: CustomerService
	) {}

	async scheduleCronJob(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne({
				name: posName,
			});
			const flowhubCompaniesList: ICompany[] = await this.companyModel.find<ICompany>({
				isActive: true,
				posId: posData._id,
			});

			const currentDate = new Date();

			const storeListsPromises = flowhubCompaniesList.map(async (companyData) => {
				return this.storeModel.find({
					companyId: companyData._id,
				});
			});

			const storeLists = await Promise.all(storeListsPromises);

			const combinedArray = [];
			for (let i = 0; i < flowhubCompaniesList.length; i++) {
				const companyData = flowhubCompaniesList[i];
				const storeList = storeLists[i];

				combinedArray.push(
					...storeList.map((storeData) => ({
						companyId: companyData._id,
						key: companyData.dataObject.key,
						clientId: companyData.dataObject.clientId,
						location: storeData.location,
						_id: storeData._id,
						lastSyncDataDuration: companyData.lastSyncDataDuration,
					}))
				);
			}

			const intervalDuration = 2000;

			const processStoresParallel = async () => {
				await Promise.all(combinedArray.map(processStoreDataWithDelay));

				console.log('All stores processed');
			};

			const processStoreDataWithDelay = async (storeData) => {
				await this.processStoreData(storeData, currentDate, posData);
				await delay(intervalDuration);
			};

			const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

			await processStoresParallel();
		} catch (error) {
			console.error('Error while scheduling cron job:', error.message);
		}
	}
	async processStoreData(storeData, currentDate: Date, posData) {
		console.log('====> ProcessStoreData function call');
		const { key, clientId, location, _id, companyId } = storeData;
		console.log('storeData ===> ' + JSON.stringify(storeData));
		const ordersCount = await this.orderModel.countDocuments({
			storeId: _id,
		});
		if (ordersCount === 0) {
			const fromDate = new Date(currentDate);
			fromDate.setDate(currentDate.getDate() - storeData.lastSyncDataDuration);
			fromDate.setHours(0, 0, 0, 0);
			const toDate = new Date(currentDate);
			toDate.setHours(0, 0, 0, 0);

			await this.seedOrders(fromDate, toDate, key, clientId, location.importId, companyId, posData);
		} else {
			const fromDate = new Date(currentDate);
			fromDate.setDate(currentDate.getDate() - 1);
			fromDate.setHours(0, 0, 0, 0);
			const toDate = new Date(currentDate);
			toDate.setHours(0, 0, 0, 0);
			await this.seedOrders(fromDate, toDate, key, clientId, location.importId, companyId, posData);
		}
	}

	async seedOrders(
		startDate: Date,
		endDate: Date,
		key: string,
		clientId: string,
		importId: string,
		companyId: string,
		posData
	) {
		console.log('====> seedOrders function call');
		try {
			const storeData = await this.storeModel.findOne({
				'location.importId': importId,
			});
			console.log('Store Name : ' + storeData.locationName);
			console.log('Start Date : ' + startDate.toISOString().split('T')[0]);
			console.log('End Date : ' + endDate.toISOString().split('T')[0]);

			const options = {
				method: 'get',
				url: `${posData.liveUrl}/v1/orders/findByLocationId/${importId}`,
				params: {
					created_after: startDate.toISOString().split('T')[0],
					created_before: endDate.toISOString().split('T')[0],
					page_size: 1000,
				},
				headers: {
					key,
					ClientId: clientId,
					Accept: 'application/json',
				},
			};

			await this.processOrders(options, posData._id, companyId, storeData._id as unknown as string);
		} catch (error) {
			console.trace('Error while seeding orders: ', error.message);
			throw error;
		}
	}

	async addItemsToCart(carts: ItemsCart[], storeId: string, id: string) {
		console.log('====> AddItemsToCart function call');
		try {
			const tempArr = carts.map((cart) => this.addSingleData(cart, storeId));
			const data = await Promise.all(tempArr);
			return { id, data };
		} catch (error) {
			console.trace('Error while adding item to cart:', error.message);
			throw error;
		}
	}

	async addStaff(staff: IStaff[], storeId: string) {
		try {
			const bulkWriteOps = staff.map((element) => ({
				updateOne: {
					filter: {
						staffName: element.staffName,
						storeId,
					},
					update: {
						$set: {
							staffName: element.staffName,
							storeId,
						},
					},
					upsert: true,
				},
			}));
			const result = await this.staffModel.bulkWrite(bulkWriteOps);
			const allStaff = await this.staffModel.find({
				staffName: { $in: staff.map((element) => element.staffName) },
				storeId,
			});
			return allStaff;
		} catch (error) {
			console.trace('Error while adding staff:', error.message);
			throw error;
		}
	}
	async syncCompanyWiseStoreData(fromDate: Date, toDate: Date, companyId) {
		try {
			const company: ICompany = await this.companyModel.findOne<ICompany>({
				isActive: true,
				_id: companyId,
			});
			if (company) {
				const storeList: IStore[] = await this.storeModel.find({
					companyId: company._id,
				});
				const posData = await this.posModel.findOne({
					_id: company.posId,
				});
				storeList.map((storeData) => {
					this.seedOrders(
						fromDate,
						toDate,
						company.dataObject.key,
						company.dataObject.clientId,
						storeData.location.importId,
						company._id,
						posData
					);
				});
			}
		} catch (error) {
			console.error('Error While syncing Data for Specific Date,', error);
		}
	}
	async addSingleData(cart: ItemsCart, storeId: string) {
		console.log('====> AddSingleData function call');
		try {
			const posCartId = cart._id ? cart._id : cart.id;
			const existingCartItem = await this.cartModel.findOne({
				posCartId: posCartId,
				storeId,
				productName: cart.productName,
			});

			if (existingCartItem === null) {
				const newCartItem = {
					...cart,
					posCartId: posCartId,
					storeId,
				};
				delete newCartItem._id;
				delete newCartItem.id;
				const createdCartItem = await this.cartModel.create(newCartItem);
				return createdCartItem._id;
			}

			return existingCartItem._id;
		} catch (error) {
			console.error('Error while adding single data to cart:', error.message);
			throw error;
		}
	}

	async processOrders(options, posId: string, companyId: string, storeId: string) {
		console.log('====> ProcessOrders function call');
		try {
			console.log('Processing Order Batch');

			this.callAxiosFun(options, posId, companyId, storeId);
		} catch (error) {
			console.trace('Error while processing orders:', error.message);
			throw error;
		}
	}
	async callAxiosFun(options, posId: string, companyId: string, storeId: string) {
		console.log('====> CallAxiosFun function call');
		let page = 1;
		let shouldContinue = true;
		while (shouldContinue) {
			options.params.page = page;
			try {
				var { data } = await axios.request(options);
			} catch (error) {
				console.error(error);
			}

			const orderData = data.orders;
			console.log('====================================');
			console.log('orderData.length ' + orderData.length);
			console.log('====================================');

			if (orderData.length > 0) {
				this.processOrderBatch(orderData, page, posId, companyId, storeId);
				page++;
			} else {
				console.log('All orders fetched');
				shouldContinue = false;
			}
		}
	}
	async replaceValueInDataArray(array, idToFind, newValue) {
		array.forEach((item) => {
			if (Array.isArray(item.data)) {
				const index = item.data.indexOf(idToFind);
				if (index !== -1) {
					item.data[index] = newValue;
				}
			}
		});
	}
	async processOrderBatch(
		orders: any,
		page: number,
		posId: string,
		companyId: string,
		storeId: string
	) {
		console.log('====> ProcessOrderBatch function call');
		try {
			console.log('Processing Order Batch number ', page);

			const temp = orders.map((x: IOrder) => ({
				staffName: x.budtender,
				posCreatedAt: new Date(x.createdAt),
				customerId: x.customerId,
			}));

			const customerIds: Set<string> = new Set(temp.map((t) => t.customerId));
			const customerIdsArray = Array.from(customerIds);
			const customers = await this.customerModel.find({
				posCustomerId: { $in: customerIdsArray },
				companyId: companyId,
			});
			console.log('found customer for comapy ID ' + companyId + ' => ' + customers.length);
			const distinctStaff = temp.reduce((accumulator, current) => {
				const existingStaff = accumulator.find(
					(staff) =>
						staff.staffName === current.staffName && staff.locationId === current.locationId
				);
				if (!existingStaff) accumulator.push(current);
				return accumulator;
			}, []);

			// const staffData = await Promise.all(
			// 	distinctStaff.map((staff: IStaff) => this.addStaff(staff, storeId))
			// );
			const staffData = await this.addStaff(distinctStaff, storeId);

			// const itemPromises = orders.map((order) =>
			// 	this.addItemsToCart(
			// 		order.itemsInCart,
			// 		storeId,
			// 		order._id ? order._id.toString() : order.id.toString()
			// 	)
			// );
			const bulkOperations = [];
			const itemsInCartIds = [];
			for (const order of orders) {
				const itemsInCartId = {};
				itemsInCartId['id'] = order._id ? order._id.toString() : order.id.toString();
				itemsInCartId['data'] = [];
				const items = order.itemsInCart.map((cart) => {
					const posCartId = cart._id ? cart._id : cart.id;
					const { _id, id, ...cartWithoutId } = cart;
					itemsInCartId['data'].push(posCartId);
					return {
						updateOne: {
							filter: { posCartId: posCartId, storeId, productName: cart.productName },
							update: {
								$set: {
									...cartWithoutId,
									posCartId: posCartId,
									storeId,
								},
							},
							upsert: true,
						},
					};
				});
				bulkOperations.push(...items);
				itemsInCartIds.push(itemsInCartId);
			}
			const cartResults = await this.cartModel.bulkWrite(bulkOperations);
			// @ts-ignore
			cartResults.result.upserted.forEach((element) => {
				const id = bulkOperations[element.index].updateOne.update.$set.posCartId;
				this.replaceValueInDataArray(itemsInCartIds, id, element._id);
			});

			const cart = itemsInCartIds;

			const orderPromises = orders.map((order) => {
				const staffId = staffData.find((staff) => staff.staffName === order.budtender)._id;
				const cartEntry = cart.find((item) => {
					return item.id === (order._id ? order._id.toString() : order.id.toString());
				});

				const items = cartEntry ? cartEntry.data : [];

				order.itemsInCart = items;
				order.staffId = staffId;

				delete order.budtender;

				const customer = customers.find((c) => c.posCustomerId === order.customerId);
				order.customerId = customer ? customer._id : order.customerId;

				const objectIdStoreId = new Types.ObjectId(storeId);
				if (customer && !customer.storeId.includes(objectIdStoreId)) {
					customer.storeId.push(objectIdStoreId);
					this.customerModel.updateOne(
						{ _id: customer ? customer._id : order.customerId },
						{ $set: { storeId: customer.storeId } }
					);
				}
				order.posOrderId = order._id ? order._id : order.id;

				delete order._id;
				delete order.id;
				const processOrder = {
					...order,
					posCreatedAt: new Date(order.createdAt.toString()),
					companyId,
					posId,
					storeId: new Types.ObjectId(storeId),
				};
				delete processOrder.createdAt;
				this.customerAudience(customer, storeId);
				return {
					updateOne: {
						filter: {
							posOrderId: order.posOrderId,
						},
						update: { $set: processOrder },
						upsert: true,
					},
				};
			});

			const processedOrders = await this.orderModel.bulkWrite(orderPromises);
			return processedOrders;
		} catch (error) {
			console.trace('Error while processing order batch:', error.message);
			throw error;
		}
	}
	async customerAudience(customer, storeId) {
		if (customer && customer.birthDate) {
			const birthYear = customer.birthDate.getFullYear();
			let audienceName = '';

			if (birthYear > 1996) {
				audienceName = AudienceName.GENERATION_Z;
			} else if (birthYear >= 1965 && birthYear <= 1980) {
				audienceName = AudienceName.GENERATION_X;
			} else if (birthYear >= 1981 && birthYear <= 1996) {
				audienceName = AudienceName.MILLENNIAL;
			} else if (birthYear >= 1946 && birthYear <= 1964) {
				audienceName = AudienceName.BOOMERS;
			}

			if (audienceName !== '') {
				const { _id: audienceId } = await this.audienceDetailsService.getAudienceIdByName(
					audienceName
				);

				try {
					this.addCustomerToAudience(audienceId, customer._id as unknown as string, storeId);
				} catch (error) {
					if (
						error.code === 11000 &&
						error.keyPattern.audienceId === 1 &&
						error.keyPattern.customerId === 1
					) {
						console.error('Duplicate key violation:' + error.message);
					} else {
						throw error;
					}
				}
			}
		}
	}
	async addCustomerToAudience(audienceId: string, customerId: string, storeId: string) {
		try {
			const existingCustomer = await this.audienceCustomerModel.findOne<AudienceCustomer>({
				audienceId,
				customerId,
			});

			if (!existingCustomer) {
				const newCustomer = await this.audienceCustomerModel.create<Partial<AudienceCustomer>>({
					audienceId,
					customerId,
					storeId,
				});
			} else {
				if (existingCustomer.storeId !== storeId) {
					const newCustomer = await this.audienceCustomerModel.create<Partial<AudienceCustomer>>({
						audienceId,
						customerId,
						storeId,
					});
				}
			}
		} catch (error) {
			if (
				error.code === 11000 &&
				error.keyPattern.audienceId === 1 &&
				error.keyPattern.customerId === 1 &&
				error.keyPattern.storeId === 1
			) {
				console.error('Duplicate key violation:' + error.message);
			} else {
				throw error;
			}
		}
	}

	async seedDutchieOrders(posData: IPOS, company: any) {
		try {
			let currentDate: Date = new Date(),
				fromDate: Date,
				toDate = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate(),
					0,
					0,
					0
				);
			let storeData: IStore;
			storeData = await this.storeModel.findOne({
				companyId: company.companyId,
			});
			const tokenOptions = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${company.key}`,
				headers: {
					Accept: 'application/json',
				},
			};

			const { data: token } = await axios.request(tokenOptions);
			const orderData: IOrder = await this.orderModel.findOne({
				companyId: company.companyId,
			});

			let orderOptions: AxiosRequestConfig;
			let paymentType: string;
			const isRetail = (iDutchieOrder: IDutchieOrderInterface) =>
				iDutchieOrder.transactionType === 'Retail';

			const processChunk = async (chunk: IDutchieOrderInterface[], page) => {
				try {
					console.log('Chunk Length ', chunk.length);
					const ordersArray: IOrderFlowHubInterface[] = [];
					const retailOrders: IDutchieOrderInterface[] = chunk.filter(isRetail);
					console.log('retailOrders Length ', retailOrders.length);
					for (let index = 0; index < retailOrders.length; index++) {
						const element = retailOrders[index];
						if (element.cashPaid !== null || element.creditPaid !== null) {
							paymentType = 'cash';
						} else if (element.giftPaid !== null) {
							paymentType = 'gift card';
						} else if (element.loyaltySpent !== null) {
							paymentType = 'loyalty points';
						} else {
							paymentType = 'debit';
						}
						const itemDiscounts: ItemDiscounts[] = [];
						const taxArray: ITaxFlowhub[] = [];
						const cartItemsArray: ICartItemFlowhub[] = [];
						for (const cartItem of element.items) {
							const product = await this.productModel.findOne({
								posProductId: cartItem.productId,
								companyId: company.companyId,
							});
							if (!product) {
								continue;
							}
							if (cartItem.discounts) {
								for (const discount of cartItem.discounts) {
									itemDiscounts.push({
										_id: discount.discountId.toString(),
										name: discount.discountName,
										discountAmount: discount.amount,
									});
								}
							}
							if (cartItem.taxes) {
								for (const tax of cartItem.taxes) {
									taxArray.push({
										_id: '',
										name: tax.rateName,
										percentage: tax.rate,
										appliesTo: 'all',
										supplierSpecificTax: false,
										excludeCustomerGroups: [],
										thisTaxInPennies: tax.amount,
									});
								}
							}
							cartItemsArray.push({
								category: product.category,
								itemDiscounts: itemDiscounts,
								id: element.transactionId.toString(),
								productName: product.productName,
								quantity: cartItem.quantity,
								sku: product.sku,
								strainName: product.strain,
								tax: taxArray,
								totalCost: cartItem.quantity * cartItem.unitCost,
								totalPrice: cartItem.totalPrice,
								unitCost: cartItem.unitCost,
								unitOfWeight: cartItem.unitWeightUnit,
								unitPrice: cartItem.unitPrice,
								title1: product.productName,
								title2: cartItem.vendor,
								brand: product.brand,
							});
						}
						const orderObject: IOrderFlowHubInterface = {
							_id: element.transactionId.toString(),
							clientId: '',
							createdAt: new Date(element.checkInDate).toISOString(),
							customerId: element.customerId.toString(),
							currentPoints: element.loyaltyEarned,
							customerType:
								element.customerTypeId === 2
									? CUSTOMER_TYPE.recCustomer
									: CUSTOMER_TYPE.medCustomer,
							name: element.completedByUser,
							locationId: storeData.location.locationId,
							locationName: storeData.locationName,
							itemsInCart: cartItemsArray,
							voided: false,
							fullName: element.completedByUser,
							orderType: orderType[element.orderType],
							payments: [
								{
									amount: element.total,
									_id: element.transactionId.toString(),
									cardId: null,
									debitProvider: '',
									paymentType,
									loyaltyPoints: element.loyaltySpent,
									balanceAfterPayment: null,
								},
							],
							totals: {
								finalTotal: element.total,
								subTotal: element.subtotal,
								totalDiscounts: element.totalDiscount,
								totalTaxes: element.tax,
								totalFees: 0,
							},
							completedOn: new Date(element.estDeliveryDateLocal).toISOString(),
							orderStatus: 'sold',
							budtender: element.employeeId.toString(),
						};
						ordersArray.push(orderObject);
					}
					//setTimeout(() => {
					this.processOrderBatch(ordersArray, page, posData._id, company.companyId, storeData._id);
					//	}, 2 * 1000);
				} catch (error) {
					console.error('Error In the chunk ', error);
				}
			};
			let orderDataFromDutchie: Array<IDutchieOrderInterface> = [];
			if (!orderData) {
				// fromDate = new Date(
				// 	currentDate.getFullYear(),
				// 	currentDate.getMonth(),
				// 	currentDate.getDate() - company.lastSyncDataDuration,
				// 	0,
				// 	0,
				// 	0
				// );
				// orderOptions = {
				// 	url: `${
				// 		posData.liveUrl
				// 	}/reporting/transactions?FromDateUTC=${fromDate.toISOString()}&ToDateUTC=${toDate.toISOString()}&IncludeDetail=true&IncludeTaxes=true&IncludeOrderIds=true`,
				// 	headers: {
				// 		Accept: 'application/json',
				// 		Authorization: token,
				// 	},
				// };

				const startDate = new Date(currentDate);
				startDate.setDate(startDate.getDate() - company.lastSyncDataDuration);

				// Calculate the number of months to cover
				const numMonths = Math.ceil(company.lastSyncDataDuration / 30);

				for (let i = 0; i < numMonths; i++) {
					const fromDate = new Date(startDate);
					fromDate.setMonth(fromDate.getMonth() + i);

					const toDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0, 23, 59, 59);

					const orderOptions = {
						url: `${
							posData.liveUrl
						}/reporting/transactions?FromDateUTC=${fromDate.toISOString()}&ToDateUTC=${toDate.toISOString()}&IncludeDetail=true&IncludeTaxes=true&IncludeOrderIds=true${
							i === 0 ? '&IncludeFeesAndDonations=true' : ''
						}`,
						headers: {
							Accept: 'application/json',
							Authorization: token,
						},
					};

					console.log(`API Calling for ${fromDate.getMonth() + 1}/${fromDate.getFullYear()}`);
					const { data } = await axios.request(orderOptions);
					console.log(
						`Total Orders for ${fromDate.getMonth() + 1}/${fromDate.getFullYear()}: ${data.length}`
					);
					orderDataFromDutchie.push(data);
				}
			} else {
				fromDate = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate() - 1,
					0,
					0,
					0
				);
				orderOptions = {
					url: `${
						posData.liveUrl
					}/reporting/transactions?FromDateUTC=${fromDate.toISOString()}&ToDateUTC=${toDate.toISOString()}&IncludeDetail=true&IncludeTaxes=true&IncludeOrderIds=true&IncludeFeesAndDonations=true`,
					headers: {
						Accept: 'application/json',
						Authorization: token,
					},
				};
				console.log('API Calling  url ' + JSON.stringify(orderOptions));
				const { data } = await axios.request(orderOptions);
				console.log('Total Order That we Are Seeding, ' + data.length);
				orderDataFromDutchie.push(data);
			}

			const chunkSize = 50;

			const arrayOfChunks = _.chunk(orderDataFromDutchie, chunkSize);

			arrayOfChunks.map((chunk: any, index: number) => processChunk(chunk, index));
		} catch (error) {
			console.error(error);
		}
	}

	async seedDutchieStaff(posData: IPOS, company: any) {
		try {
			const tokenOptions = {
				method: 'get',
				url: `${posData.liveUrl}/util/AuthorizationHeader/${company.key}`,
				headers: {
					Accept: 'application/json',
				},
			};

			const { data: token } = await axios.request(tokenOptions);
			console.log('company.key =>' + company.key);
			console.log('token =>' + token);

			const staffOptions: AxiosRequestConfig = {
				url: `${posData.liveUrl}/employees`,
				headers: {
					Accept: 'application/json',
					Authorization: token,
				},
			};

			const { data } = await axios.request(staffOptions);

			const storeData: IStore = await this.storeModel.findOne({
				companyId: company.companyId,
			});

			const bulkOps = data.map((d) => ({
				updateOne: {
					filter: { staffName: d.fullName, storeId: storeData._id },
					update: { $setOnInsert: { staffName: d.fullName, storeId: storeData._id } },
					upsert: true,
				},
			}));

			const result = await this.staffModel.bulkWrite(bulkOps);

			console.log(
				`Seeded ${result.upsertedCount} new employees and updated ${result.modifiedCount} existing employees.`
			);
		} catch (error) {
			console.error('Failed to seed staff data:');
			console.error(error.message);
			throw error;
		}
	}

	async migrateOrderType() {
		try {
			const pos = await this.posModel.findOne({
				name: 'dutchie',
			});

			const companies = await this.companyModel.find({
				posId: pos._id,
			});

			for (const company of companies) {
				const orders = await this.orderModel.find({
					companyId: company._id,
				});

				const bulkOps = [];
				for (const order of orders) {
					if (order.orderType in orderType) {
						bulkOps.push({
							updateOne: {
								filter: { _id: order._id },
								update: { $set: { orderType: orderType[order.orderType] } },
							},
						});
					}
				}
				await this.orderModel.bulkWrite(bulkOps);
			}

			console.log('Migration complete.');
		} catch (error) {
			throw new Error(error);
		}
	}
}
