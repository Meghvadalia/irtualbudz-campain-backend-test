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
		const age = await this.calculateAverageAge();

		const sum = age.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			0
		);
		const averageAge = (sum / age.length).toFixed(1);

		const { averageSpend, loyaltyPointsConverted } =
			await this.calculateAverageSpendAndLoyaltyPoints();

		const {
			totalOrderAmount,
			percentageGrowth,
			totalOrders,
			orderGrowth,
			dateWiseOrderData,
		} = await this.totalSales(query);

		const totalDiscounts = await this.totalDiscounts();

		// const brandTotal = await this.calculatebrandTotal();

		const topCategory = await this.topSellingCategory();
		const { medCustomerRatio, recCustomerRatio } =
			await this.recVsMedCustomer();
		const weekOrders = await this.getOrderCountsByDayOfWeek();
		const hourlyData = await this.getOrderCountsByHour();

		const brandWiseOrderData = await this.orderService.getBrandWiseSales(
			query.fromDate,
			query.toDate
		);
		const staffWiseOrderData = await this.orderService.getEmployeeWiseSales(
			query.fromDate,
			query.toDate
		);

		return {
			overview: {
				totalSales: {
					totalOrderAmount,
					percentageGrowth,
				},
				order: {
					totalOrders,
					orderGrowth,
				},
				totalDiscounts,
				dateWiseOrderData,
			},
			customer: {
				averageAge,
				averageSpend,
				loyaltyPointsConverted,
				topCategory,
				recOrMedCustomer: {
					newCustomer: medCustomerRatio,
					returnningCustomer: recCustomerRatio,
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
		const ageArray: number[] = [];
		const users = await this.customerService.getCustomers();

		users.map((user) => {
			const birthDate = new Date(user.birthDate);
			const now = new Date();
			let age = now.getFullYear() - birthDate.getFullYear();

			const hasBirthdayPassed =
				now.getMonth() > birthDate.getMonth() ||
				(now.getMonth() === birthDate.getMonth() &&
					now.getDate() >= birthDate.getDate());
			if (!hasBirthdayPassed) {
				age--;
			}

			ageArray.push(age);
		});
		return ageArray;
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
		const orderList = await this.orderService.getOrders();

		const customerType = orderList.flatMap((order) => order.customerType);

		const totalCount = customerType.length;
		const recCustomerCount = customerType.reduce(
			(count, type) => (type === 'recCustomer' ? count + 1 : count),
			0
		);
		const medCustomerCount = totalCount - recCustomerCount;

		const recCustomerRatio = (
			(recCustomerCount / totalCount) *
			100
		).toFixed(2);
		const medCustomerRatio = (
			(medCustomerCount / totalCount) *
			100
		).toFixed(2);

		return {
			recCustomerRatio,
			medCustomerRatio,
		};
	}

	async calculateAverageSpendAndLoyaltyPoints() {
		const orderList = await this.orderService.getOrders();

		const payments = orderList
			.flatMap((order) => order.payments)
			.map((payment) => payment.amount);

		const paymentSum = payments.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			0
		);
		const average = (paymentSum / payments.length).toFixed(2);

		const loyaltyPoints = orderList
			.flatMap((order) => order.payments)
			.map((payment) => payment.loyaltyPoints)
			.filter((loyaltyPoints) => typeof loyaltyPoints === 'number');

		const loyaltyPointsSum = loyaltyPoints.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			0
		);

		return {
			averageSpend: average,
			loyaltyPointsConverted: loyaltyPointsSum,
		};
	}

	async totalSales(query) {
		const { fromDate, toDate } = query;
		const formattedFromDate = dayjs(fromDate).format(
			'YYYY-MM-DDT00:00:00.000[Z]'
		);
		const formattedToDate = dayjs(toDate).format(
			'YYYY-MM-DDT23:59:59.999[Z]'
		);

		const { fromOrderList, toOrderList, orderList } =
			await this.orderService.getOrdersByDate(
				formattedFromDate,
				formattedToDate
			);

		const ordersGrowth =
			((toOrderList.length - fromOrderList.length) /
				fromOrderList.length) *
			100;
		const orderSum = toOrderList.length > fromOrderList.length ? '+' : '-';
		const orderGrowth = `${orderSum}${Math.abs(ordersGrowth).toFixed(2)}%`;

		const startOrderAmount = fromOrderList
			.flatMap((order) => order.payments)
			.map((payment) => payment.amount);
		const toOrderAmount = toOrderList
			.flatMap((order) => order.payments)
			.map((payment) => payment.amount);

		const startOrderSum = +startOrderAmount.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			0
		);
		const toOrderSum = +toOrderAmount.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			0
		);

		const orderAmount = orderList
			.flatMap((order) => order.payments)
			.map((payment) => payment.amount);
		const totalOrderAmount = orderAmount.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			0
		);

		const growth = ((toOrderSum - startOrderSum) / startOrderSum) * 100;
		const sign = toOrderSum > startOrderSum ? '+' : '-';
		const totalGrowth = `${sign}${Math.abs(growth).toFixed(2)}%`;

		const dateWiseOrderData = await this.orderService.getOrderForEachDate(
			fromDate,
			toDate
		);

		return {
			totalOrderAmount,
			percentageGrowth: totalGrowth,
			totalOrders: orderList.length,
			orderGrowth,
			dateWiseOrderData,
		};
	}

	async getOrderCountsByDayOfWeek() {
		const busiestDay = await this.orderService.fourteenDaysOrderList();

		const dayCounts = busiestDay.reduce((counts, order) => {
			const createdAt = new Date(order.createdAt);
			const dayOfWeek = createdAt.getUTCDay();
			counts[dayOfWeek] = (counts[dayOfWeek] || 0) + 1;
			return counts;
		}, []);

		const dayOfWeekLabels = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];

		const orderCountsByDayOfWeek = dayOfWeekLabels.map(
			(dayOfWeek, index) => {
				const count = dayCounts[index] || 0;
				return { dayOfWeek, count };
			}
		);

		return orderCountsByDayOfWeek;
	}

	async getOrderCountsByHour() {
		const orders = await this.orderService.currentDaysOrderList();

		const hourCounts = Array(12).fill(0); // Initialize count array for each hour from 10 AM to 9 PM

		orders.forEach((order) => {
			const createdAt = new Date(order.createdAt);
			const hour = createdAt.getUTCHours();
			if (hour >= 10 && hour <= 21) {
				hourCounts[hour - 10]++;
			}
		});

		const hourLabels = Array.from(
			{ length: 12 },
			(_, index) => ((index + 10) % 12) + (index >= 6 ? ' PM' : ' AM')
		);

		const orderCountsByHour = hourLabels.map((hourLabel, index) => {
			const count = hourCounts[index];
			return { hour: hourLabel, count };
		});

		return orderCountsByHour;
	}

	async totalDiscounts() {
		const orderList = await this.orderService.getOrders();

		const payments = orderList
			.flatMap((order) => order.totals)
			.map((total) => total.totalDiscounts);

		const totalDiscounts = payments.reduce(
			(accumulator, currentValue) => accumulator + currentValue,
			0
		);
		return totalDiscounts.toFixed(2);
	}

	async topSellingCategory() {
		const orderList = await this.orderService.getOrders();
		const cartItems = orderList.flatMap((order) => {
			return order.itemsInCart;
		});

		let categoryCount = {};

		for (let item of cartItems) {
			const itemId = item._id.toString();
			try {
				const products = await this.cartModel.find({ _id: itemId });

				for (let product of products) {
					const category = product.category;
					if (categoryCount[category]) {
						categoryCount[category]++;
					} else {
						categoryCount[category] = 1;
					}
				}
			} catch (error) {
				console.error(error);
			}
		}

		let maxCount = 0;
		let topCategory = '';

		for (let category in categoryCount) {
			if (categoryCount[category] > maxCount) {
				maxCount = categoryCount[category];
				topCategory = category;
			}
		}
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
