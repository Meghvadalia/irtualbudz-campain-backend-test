/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Customer } from 'src/microservices/customers/entities/customer.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { dynamicCatchException } from 'src/utils/error.utils';
import { Order } from 'src/microservices/order/entities/order.entity';
import { Store } from 'src/model/store/entities/store.entity';
import { OrderService } from 'src/microservices/order/services/order.service';
import { InventoryService, Product } from 'src/microservices/inventory';

@Injectable()
export class TreezService {
	constructor(
		private readonly OrderService: OrderService,
		private readonly InventoryService: InventoryService,
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Customer.name) private customerModel: Model<Customer>,
		@InjectModel(Product.name) private productModel: Model<Product>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(POS.name) private posModel: Model<POS>
	) {}
	async authAccessToken() {
		try {
			const config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: process.env.TREEZ_URL + '/config/api/gettokens',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				data: new URLSearchParams({
					client_id: process.env.CLIENT_ID,
					apikey: process.env.API_KEY,
				}),
			};

			const response = await axios.request(config);
			const token = response.data.access_token;
			console.log('Access Token Generated');
			return token;
		} catch (error) {
			console.log('Error while Authorization', JSON.stringify(error));
		}
	}

	async syncCustomerFromTreez(posData: IPOS, token: string, company: ICompany) {
		console.log(`SYNC CUSTOMER FROM POS ${posData.name}...`);
		try {
			// const posData: IPOS = await this.posModel.findOne({
			// 	name: posName,
			// });
			// const companiesList: ICompany[] = await this.companyModel.find<ICompany>({
			// 	isActive: true,
			// 	posId: posData._id,
			// });
			console.log(`Company Founded in POS ${posData.name}`);

			const date = new Date();
			let fromDate, toDate;
			let options: AxiosRequestConfig;

			// for (const company of companiesList) {
			console.log(`Configration started for Company ${company.name}`);
			let page = 1;
			const shouldContinue = true;
			let customers = [];

			const customer = await this.customerModel.findOne({
				companyId: company._id,
			});
			if (customer) {
				console.log('Customer Data Fetching for previous day');
			} else {
				console.log(`Customer Data Fetching for last ${company.lastSyncDataDuration} day`);
			}

			while (shouldContinue) {
				if (customer) {
					fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0)
						.toISOString()
						.split('T')[0];
					toDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
						.toISOString()
						.split('T')[0];
					// console.log('Seeding data for the previous day');
					options = {
						method: 'get',
						maxBodyLength: Infinity,
						url: `${posData.liveUrl}/${company.dataObject.dispensary}/customer/signup/from/${fromDate}/to/${toDate}/page/${page}/pagesize/50`,
						headers: {
							Authorization: `Bearer ${token}`,
							client_id: process.env.CLIENT_ID,
						},
					};
				} else {
					// console.log('Seeding all customers...');
					fromDate = new Date(
						date.getFullYear(),
						date.getMonth(),
						date.getDate() - company.lastSyncDataDuration,
						0,
						0,
						0
					)
						.toISOString()
						.split('T')[0];
					toDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
						.toISOString()
						.split('T')[0];
					options = {
						method: 'get',
						maxBodyLength: Infinity,
						url: `${posData.liveUrl}/${company.dataObject.dispensary}/customer/signup/from/${fromDate}/to/${toDate}/page/${page}/pagesize/50`,
						headers: {
							Authorization: `Bearer ${token}`,
							client_id: process.env.CLIENT_ID,
						},
					};
				}

				const response = await axios.request(options);
				const data = response.data;
				console.log(
					`Customer Data Fetched for company ${company.name} page ${page} data length ${data.data.length}`
				);
				const sortedCustomers = [];
				const customerData = data.data;
				for (let index = 0; index < data.data.length; index++) {
					// eslint-disable-next-line prefer-const
					let customer = data.data[index];
					const primaryAddress = customer.addresses?.find((address) => address.primary === true);
					const customerObject = {
						updateOne: {
							filter: {
								posCustomerId: customer.customer_id ?? customer.id,
								companyId: company._id,
							},
							update: {
								$set: {
									companyId: company._id,
									posCustomerId: customer.customer_id,
									POSId: posData._id,
									name: `${customer.first_name || ''} ${customer.middle_name || ''} ${
										customer.last_name || ''
									}`,
									email: customer.email,
									phone: customer.phone,
									city: primaryAddress?.city,
									state: primaryAddress?.state,
									birthDate: customer.birthday,
									isLoyal: !(customer.warning_1 === false && customer.warning_2 === false),
									loyaltyPoints: customer.rewards_balance,
									storeId: [],
									type: '',
									zip: primaryAddress?.zipcode,
									userCreatedAt: customer.signup_date,
								},
							},
							upsert: true,
						},
					};
					customer.addresses?.forEach((address, index) => {
						const streetAddressKey = `streetAddress${index + 1}`;
						const street1 = address.street1 || '';
						const street2 = address.street2 || '';
						const city = address.city || '';
						const state = address.state || '';
						const zipcode = address.zipcode || '';

						const fullAddress = `${street1} ${street2} ${city} ${state} ${zipcode}`.trim();
						if (fullAddress !== '') {
							customerObject.updateOne.update.$set[streetAddressKey] = fullAddress;
						}
					});
					sortedCustomers.push(customerObject);
				}
				customers = customers.concat(sortedCustomers);
				if (data.data.length === 0) {
					console.log('All Customers Fetched');
					break;
				}
				page++;
			}
			await this.customerModel.bulkWrite(customers);
			console.log(`${customers.length} Customers Bulkwrite Completed`);
			return true;
			// }
		} catch (error) {
			console.error('Error while seeding customers:', error);
			dynamicCatchException(error);
		}
	}

	async syncOrederFromTreez(posData: IPOS, token: string, company: ICompany) {
		console.log(`SYNC ORDERS FROM POS ${posData.name}...`);
		try {
			// const posData: IPOS = await this.posModel.findOne({
			// 	name: posName,
			// });
			// const companiesList: ICompany[] = await this.companyModel.find<ICompany>({
			// 	isActive: true,
			// 	posId: posData._id,
			// });
			console.log(`Company Founded in POS ${posData.name}`);
			const date = new Date();

			let fromDate, lastdate;
			// for (const company of companiesList) {
			console.log(`Configration started for Company ${company.name}`);
			let page = 1;
			const shouldContinue = true;
			let sortedByLocationName = {};
			let locationNames = [];
			let ignored = [];
			let orderCount = 0;
			const order = await this.orderModel.findOne({
				companyId: company._id,
			});
			let isNew = false;
			let tempUrl
			if (order) {
				console.log('Order Data Fetching for previous day');
				fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0);
				lastdate = fromDate.toISOString().replace('Z', '-07:00');
				
			} else {
				let totalDays = company?.lastSyncDataDuration ? company?.lastSyncDataDuration :29
				console.log(`Order Data Fetching for last ${totalDays} day`);
				fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - totalDays , 0, 0, 0);
				lastdate = fromDate.toISOString().split('T')[0];
				isNew = true
			}

			while (shouldContinue) {
				if(isNew){
					tempUrl = `${posData.liveUrl}/${company.dataObject.dispensary}/ticket/closedate/${lastdate}/page/${page}/pagesize/50?hide_empty_tickets=true`;
				}else{
					tempUrl = `${posData.liveUrl}/${company.dataObject.dispensary}/ticket/lastUpdated/after/${lastdate}/page/${page}/pagesize/50`
				}
				let options = {
					method: 'get',
					maxBodyLength: Infinity,
					url: tempUrl,
					headers: {
						Authorization: `Bearer ${token}`,
						client_id: company.dataObject.clientId,
					},
				};
				
				const { data } = await axios.request(options);
				const orders = data.ticketList;
				orderCount = orderCount + orders.length;
				console.log(
					`ORDER Data Fetched for company ${company.name} page ${page} data length ${orders.length}`
				);
				const VERIFICATION_PENDING = orders.filter(
					(obj) => obj.order_status === 'VERIFICATION_PENDING'
				);
				const AWAITING_PROCESSING = orders.filter(
					(obj) => obj.order_status === 'AWAITING_PROCESSING'
				);
				const IN_PROCESS = orders.filter((obj) => obj.order_status === 'IN_PROCESS');
				const PACKED_READY = orders.filter((obj) => obj.order_status === 'PACKED_READY');
				const OUT_FOR_DELIVERY = orders.filter((obj) => obj.order_status === 'OUT_FOR_DELIVERY');
				const completedOrders = orders.filter((obj) => obj.order_status === 'COMPLETED');
				const CANCELED = orders.filter((obj) => obj.order_status === 'CANCELED');
				let orderDetails = {
					VERIFICATION_PENDING: VERIFICATION_PENDING.length,
					AWAITING_PROCESSING: AWAITING_PROCESSING.length,
					IN_PROCESS: IN_PROCESS.length,
					PACKED_READY: PACKED_READY.length,
					OUT_FOR_DELIVERY: OUT_FOR_DELIVERY.length,
					COMPLETED: completedOrders.length,
					CANCELED: CANCELED.length,
				};
				console.log('Sorted Order By Order Status');
				console.log(JSON.stringify(orderDetails));
				console.log('COMPLETED ORDERS MAPING PROCESS STARTED...');
				for (const order of completedOrders) {
					const items = order.items;
					const isSameLocation = items.every(
						(item) => item.location_name === items[0].location_name
					);

					let orderTypeValue: string;

					if (order.type === 'POS' || order.type === 'DELIVERY') {
						orderTypeValue = 'in-store';
					} else if (order.type === 'PICKUP') {
						orderTypeValue = 'Pickup';
					} else if (order.type === 'EXPRESS') {
						orderTypeValue = 'online';
					} else {
						orderTypeValue = 'in-store';
					}
					if (isSameLocation) {
						const itemsInCart = [];
						const payments = [];
						const orderMap = {
							budtender: order.created_by_employee.name,
							budtenderId: order.created_by_employee.employee_id,
							clientId: null,
							completedOn: order.date_closed,
							createdAt: order.date_created,
							currentPoints: order.reward_points_earned - order.reward_points_used,
							customerId: order.customer_id,
							customerType: null,
							fullName: order.created_by_employee.name,
							id: order.ticket_id,
							locationId: null,
							locationName: order.items[0].location_name,
							name: null,
							orderStatus: order.order_status,
							orderType: orderTypeValue,
							totals: {
								finalTotal: order.total,
								subTotal: order.sub_total,
								totalDiscounts: order.discount_total,
								totalFees: null,
								totalTaxes: order.tax_total,
							},
							voided: null,
						};

						//itemsInCart Configuration
						items?.forEach((element, idx) => {
							const discounts = [];
							const tax = [];
							const sample = {
								brand: element.product_brand,
								category: element.product_subtype,
								id: element.product_id,
								productName: element.product_size_name,
								quantity: element.quantity,
								regulatoryId: null,
								sku: element.product_id,
								strainName: null,
								title1: null,
								title2: null,
								totalCost: element.price_total,
								totalDiscounts: null,
								totalPrice: null,
								unitCost: null,
								unitOfWeight: element.product_unit,
								unitPrice: null,
							};
							element?.discounts?.forEach((element) => {
								discounts.push({
									couponCode: null,
									discountAmount: element.discount_amount,
									discountId: element.id,
									discountType: element.discount_category,
									discounterId: null,
									dollarsOff: null,
									isCartDiscount: element.cart,
									name: element.discount_title,
									penniesOff: null,
									percentOff: null,
									quantity: null,
									type: element.discount_method,
								});
							});
							sample['itemDiscounts'] = discounts;
							element?.tax?.forEach((element) => {
								tax.push({
									calculateBeforeDiscounts: null,
									name: element.tax_name,
									percentage: null,
									supplierSpecificTax: null,
								});
							});
							sample['tax'] = tax;

							itemsInCart.push(sample);
							orderMap['itemsInCart'] = itemsInCart;
						});
						orderMap['itemsInCart'] = itemsInCart;

						//payment configuration
						order?.payments?.forEach((element) => {
							payments.push({
								_id: element.payment_id,
								amount: element.amount_paid,
								paymentType: element.payment_method,
							});
						});
						orderMap['payments'] = payments;

						const locationName = items[0].location_name;

						if (!sortedByLocationName[locationName]) {
							sortedByLocationName[locationName] = [];
							if (!locationNames.includes(locationName)) {
								locationNames.push(locationName);
							}
						}

						sortedByLocationName[locationName].push(orderMap);
					} else {
						ignored.push(order);
					}
				}

				if (orders.length === 0) {
					const counteOrders = (obj) => {
						let count = {};
						for (let store in obj) {
							count[store] = obj[store].length;
						}
						return count;
					};
					console.log('ALL ORDERS FETCHED');
					let orderReport = {
						totalOrderFetched: orderCount,
						totalStoreWithOrder: counteOrders(sortedByLocationName),
					};
					console.log(`ORDERS REPORT ${JSON.stringify(orderReport)}`);
					break;
				}
				page++;
			}
			const updatedObj2 = {};
			const storeIds = await this.setupStoreConfig(locationNames, company);
			for (const key in sortedByLocationName) {
				// eslint-disable-next-line no-prototype-builtins
				if (sortedByLocationName.hasOwnProperty(key)) {
					const newValue = storeIds[key];
					updatedObj2[newValue] = sortedByLocationName[key];
				}
			}
			for (let storeID in updatedObj2) {
				// eslint-disable-next-line no-prototype-builtins
				if (updatedObj2.hasOwnProperty(storeID)) {
					const dataArray = updatedObj2[storeID];
					for (let i = 0; i < dataArray.length; i += 50) {
						const chunk = dataArray.slice(i, i + 50);
						await this.OrderService.processOrderBatch(
							chunk,
							page,
							posData._id,
							company._id,
							storeID,
							false
						);
					}
				}
			}
			// }
		} catch (error) {
			console.error('Error fetching orders:');
			console.log(error)
		}
	}

	async setupStoreConfig(storeNames, company) {
		console.log('STORE CONFIGRATION STARTED');
		try {
			console.log(`Founded Stores Name ${JSON.stringify(storeNames)}`);
			const storeIds = {};
			const storePromises = storeNames.map(async (name, index) => {
				const existingStore = await this.storeModel.findOne({
					locationName: name,
				});
				if (existingStore) {
					storeIds[name] = existingStore._id;
					console.log('existing Store Data');
					console.log(existingStore);
				} else {
					const createBrandData = {
						storeName: name,
						storeEmail: 'info@virtualbudz.com',
						password: '1234567890',
						storeTimezone: 'US/Mountain',
					};
					const brandData = await this.createBrand(createBrandData);
					const responce = await this.storeModel.create({
						location: {},
						companyId: company._id,
						hoursOfOperation: null,
						phonenumber: '(970) 764-4087',
						email: 'info@virtualbudz.com',
						address: [],
						timeZone: 'US/Mountain',
						licenseType: [],
						website: 'https://valleymeade.com/',
						locationName: name,
						brandId: brandData.data.data.appId,
						sendyUserId: brandData.data.data.loginId,
					});
					storeIds[name] = responce._id;
					console.log(`${name} Store created`);
				}
			});

			await Promise.all(storePromises);
			console.log(`${company.name} company ${JSON.stringify(storeIds)} stores Generated`);

			return storeIds;
		} catch (error) {
			console.error('Error while creating Store:', error);
			throw error;
		}
	}
	async createBrand(brandData: any): Promise<AxiosResponse> {
		const credentials = Buffer.from(
			`${process.env.TRACKING_AUTH_USERNAME}:${process.env.TRACKING_AUTH_PASSWORD}`
		).toString('base64');
		const brandApiUrl = `${process.env.TRACKING_SERVER}/brandCreate/brand`;
		const headers: AxiosRequestConfig['headers'] = {
			'Content-Type': 'application/json',
			Authorization: `Basic ${credentials}`,
		};

		try {
			const response = await axios.post(brandApiUrl, brandData, { headers });
			return response;
		} catch (error) {
			console.error('Error while creating brand:');
			console.log(JSON.stringify(error))
			throw error;
		}
	}
	async syncProductFromTreez(posData: IPOS, token: string, company: ICompany) {
		console.log(`SYNC PRODUCTS FROM POS ${posData.name}...`);
		// const posData: IPOS = await this.posModel.findOne({
		// 	name: posName,
		// });
		// const companiesList: ICompany[] = await this.companyModel.find<ICompany>({
		// 	isActive: true,
		// 	posId: posData._id,
		// });
		// console.log(`${companiesList.length} Company Founded in POS ${posName}`);
		let options: AxiosRequestConfig;
		// for (const company of companiesList) {
		console.log(`Configration started for Company ${company.name}`);
		const product = await this.productModel.findOne({
			companyId: company._id,
		});
		let page = 1;
		const products = [];
		let shouldContinue = true;
		let date = new Date();
		let fromDate;
		if (product) {
			console.log('Product Data Fetching for previous day');
			fromDate = new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate() - 1,
				0,
				0,
				0
			).toISOString();
		} else {
			console.log('All Product Data Fetching');
		}
		while (shouldContinue) {
			if (product) {
				options = {
					method: 'get',
					maxBodyLength: Infinity,
					url: `${posData.liveUrl}/${company.dataObject.dispensary}/product/product_list/lastUpdated/after/${fromDate}?active=true&page=${page}`,
					headers: {
						Authorization: `Bearer ${token}`,
						client_id: process.env.CLIENT_ID,
					},
				};
			} else {
				options = {
					method: 'get',
					maxBodyLength: Infinity,
					url: `${posData.liveUrl}/${company.dataObject.dispensary}/product/product_list?page=${page}&active=true`,
					headers: {
						Authorization: `Bearer ${token}`,
						client_id: process.env.CLIENT_ID,
					},
				};
			}
			const responce = await axios.request(options);
			const productArray = responce.data.data.product_list;
			console.log(
				`PRODUCT Data Fetched for company ${company.name} page ${page} data length ${productArray.length}`
			);
			for (const product of productArray) {
				let productUOM: string;

				if (product.product_configurable_fields.uom === 'GRAMS') {
					productUOM = 'g';
				} else if (product.product_configurable_fields.uom === 'MILLIGRAMS') {
					productUOM = 'mg';
				} else {
					productUOM = 'each';
				}
				const mapProduct = {
					companyId: company._id,
					posProductId: product.product_id,
					brand: product?.product_configurable_fields?.brand,
					category: product.category_type,
					extraDetails: {
						isMixAndMatch: null,
						isStackable: null,
						nutrients: null,
						weightTierInformation: [],
						cannabinoidInformation: [],
						productUnitOfMeasure: productUOM,
						productUnitOfMeasureToGramsMultiplier: null,
					},
					posId: posData._id,
					productDescription: product?.e_commerce?.product_description,
					productName: product?.product_configurable_fields?.name,
					productPictureURL: product?.e_commerce?.primary_image,
					productWeight: product?.product_configurable_fields?.amount,
					purchaseCategory: null,
					sku: null,
					speciesName: null,
					type: product?.product_configurable_fields?.subtype,
				};

				if (product.pricing?.price_type === 'TIER') {
					const generateName = (tire) => {
						let predefinedValue;
						let tireMethod = product.pricing?.tier_pricing_detail;
						switch (tire.start_value) {
							case 1:
								predefinedValue = 'gram';
								break;
							case 1.75:
								predefinedValue = 'halfEighth';
								break;
							case 3.5:
								predefinedValue = 'eighth';
								break;
							case 7:
								predefinedValue = 'quarter';
								break;
							case 14:
								predefinedValue = 'halfOunce';
								break;
							case 28:
								predefinedValue = 'ounce';
								break;
							case 30:
								predefinedValue = 'ounce';
								break;
							default:
								predefinedValue = `${tire.start_value} - ${tireMethod}`;
								break;
						}
						return predefinedValue;
					};
					const weightTireInformation = [];
					product.pricing?.tier_pricing_detail?.forEach((tire) => {
						if (tire?.start_value > 0) {
							weightTireInformation.push({
								name: generateName(tire),
								gramAmount: tire.start_value,
								pricePerUnitInMinorUnits: tire.price_per_value,
							});
						}
					});
					mapProduct.extraDetails.weightTierInformation = weightTireInformation;
				}
				if (product.lab_results?.length > 0) {
					const labResults = [];
					product.lab_results.forEach((elm) => {
						labResults.push({
							name: elm.result_type,
							lowerRange: elm.amount.minimum_value,
							upperRange: elm.amount.maximum_value,
							unitOfMeasure: elm.amount_type,
							unitOfMeasureToGramsMultiplier: null,
						});
					});
					mapProduct.extraDetails.cannabinoidInformation = labResults;
				}
				products.push(mapProduct);
			}
			if (productArray.length === 0) {
				console.log('ALL PRODUCT FETCHED');
				break;
			}
			page++;
		}
		if (products.length > 0) {
			await this.InventoryService.updateOrCreateProducts(products);
			console.log(`${products.length} products bulkwrite completed`);
		} else {
			console.log('No Product fetched');
		}
		// }
	}
}
