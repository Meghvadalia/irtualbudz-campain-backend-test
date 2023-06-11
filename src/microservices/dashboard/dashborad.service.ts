import { Injectable } from '@nestjs/common';
import { CustomerService } from '../customers/customer.service';
import { OrderService } from '../order/services/order.service';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from '../order/entities/cart.entity';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';

@Injectable()
export class DashboardService {
	constructor(
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
		private readonly customerService: CustomerService,
		private readonly orderService: OrderService
	) {}

	async getCalculatedData(query: { fromDate: string; toDate: string }) {
		const averageAge = await this.calculateAverageAge();

		const { averageSpend, loyaltyPointsConverted } =
			await this.calculateAverageSpendAndLoyaltyPoints();

		const {
			totalOrderAmount,
			percentageOrderGrowth,
			totalOrders,
			dateWiseOrderData,
			totalDiscounts,
			discountGrowth,
			orderCountGrowth,
		} = await this.totalSales(query);

		// const brandTotal = await this.calculatebrandTotal();

		const topCategory = await this.topSellingCategory();
		const { returningCustomer: returningCustomer, newCustomer } =
			await this.recVsMedCustomer();
		const weekOrders = await this.getOrderCountsByDayOfWeek();
		const hourlyData = await this.getOrderCountsByHour();

		const brandWiseOrderData = await this.orderService.getBrandWiseSales(
			query.fromDate,
			query.toDate
		);
		const staffWiseOrderData =
			await this.orderService.getEmployeeWiseSales();

		return {
			overview: {
				totalSales: {
					totalOrderAmount,
					percentageOrderGrowth,
				},
				order: {
					totalOrders,
					orderCountGrowth,
				},
				discount: {
					totalDiscounts,
					discountGrowth,
				},
				dateWiseOrderData,
			},
			customer: {
				averageAge,
				averageSpend,
				loyaltyPointsConverted,
				topCategory,
				recOrMedCustomer: {
					newCustomer: newCustomer,
					returnningCustomer: returningCustomer,
				},
			},
			sales: {
				brandWiseSalesData: brandWiseOrderData,
			},
			operations: {
				weekOrders,
				hourlyData,
				staffWiseOrderData,
			},
		};
	}

	async calculateAverageAge() {
		// const ageArray: number[] = [];
		// const users = await this.customerService.getCustomers();

		// users.map((user) => {
		// 	const birthDate = new Date(user.birthDate);
		// 	const now = new Date();
		// 	let age = now.getFullYear() - birthDate.getFullYear();

		// 	const hasBirthdayPassed =
		// 		now.getMonth() > birthDate.getMonth() ||
		// 		(now.getMonth() === birthDate.getMonth() &&
		// 			now.getDate() >= birthDate.getDate());
		// 	if (!hasBirthdayPassed) {
		// 		age--;
		// 	}

		// 	ageArray.push(age);
		// });
		const averageAge = await this.customerService.getAverageAge();
		return averageAge;
	}

	async calculatebrandTotal() {
		const orderList = await this.orderService.getOrders();
		const cartItems = orderList.flatMap((order) => {
			return order.itemsInCart;
		});

		let productList = [];
		for (let item of cartItems) {
			const itemId = item._id.toString();
			try {
				const products = await this.cartModel.find({ _id: itemId });
				products.forEach((p) => {
					productList.push(p.productName);
				});

				for (let productName of productList) {
				}
			} catch (error) {
				console.error(error);
			}
		}
	}

	async recVsMedCustomer() {
		const customerPercentage =
			this.orderService.getRecurringAndNewCustomerPercentage();

		return customerPercentage;
	}

	async calculateAverageSpendAndLoyaltyPoints() {
		const averageSpendWithLoyalty =
			await this.orderService.getAverageSpendAndLoyaltyPointsForAllCustomer();
		return averageSpendWithLoyalty;
	}

	async totalSales(query) {
		const { fromDate, toDate } = query;
		const formattedFromDate = dayjs(fromDate).format(
			'YYYY-MM-DDT00:00:00.000[Z]'
		);
		const formattedToDate = dayjs(toDate).format(
			'YYYY-MM-DDT23:59:59.999[Z]'
		);

		const {
			totalOrderAmount,
			totalDiscounts,
			orderCount,
			orderGrowth,
			discountGrowth,
			orderCountGrowth,
		} = await this.orderService.totalOverViewCountForOrdersBetweenDate(
			formattedFromDate,
			formattedToDate
		);

		const dateWiseOrderData = await this.orderService.getOrderForEachDate(
			fromDate,
			toDate
		);

		return {
			totalOrderAmount,
			percentageOrderGrowth: orderGrowth,
			totalOrders: orderCount,
			orderGrowth,
			dateWiseOrderData,
			totalDiscounts,
			discountGrowth,
			orderCountGrowth,
		};
	}

	async getOrderCountsByDayOfWeek() {
		const orderCountsByDayOfWeek =
			await this.orderService.getWeeklyBusiestDataForSpecificRange();

		return orderCountsByDayOfWeek;
	}

	async getOrderCountsByHour() {
		const orderCountsByHour =
			await this.orderService.getHourWiseDateForSpecificDateRange();

		return orderCountsByHour;
	}

	async totalDiscounts() {
		const totalDiscounts = await this.orderService.getAllTotalDiscount();
		return totalDiscounts;
	}

	async topSellingCategory() {
		const topCategory = await this.orderService.getTopCategory();
		return topCategory;
	}

	// async loyaltyPointsConverted() {
	// 	const orderList = await this.orderService.getOrders();

	// 	const loyaltyPoints = orderList
	// 		.flatMap((order) => order.payments)
	// 		.map((payment) => payment.loyaltyPoints)
	// 		.filter((loyaltyPoints) => typeof loyaltyPoints === 'number');

	// 	const loyaltyPointsSum = loyaltyPoints.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

	// 	return loyaltyPointsSum;
	// }

	// async calculateAverageSpend() {
	// 	const orderList = await this.orderService.getOrders();

	// 	const payments = orderList
	// 		.flatMap((order) => {
	// 			return order.payments;
	// 		})
	// 		.map((payment) => payment.amount);

	// 	const paymentSum = payments.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
	// 	const average = (paymentSum / payments.length).toFixed(2);

	// 	return average;
	// }
}
