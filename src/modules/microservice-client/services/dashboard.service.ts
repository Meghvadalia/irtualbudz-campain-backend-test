import { Injectable } from '@nestjs/common';
import { CustomerService } from '../services/customer.service';
import { OrderService } from '../services/order.service';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from '../../../microservices/order/entities/cart.entity';
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

		const { averageSpend, loyaltyPointsConverted } = await this.calculateAverageSpendAndLoyaltyPoints();

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
		const { returningCustomer: returningCustomer, newCustomer } = await this.recVsMedCustomer();
		const weekOrders = await this.getOrderCountsByDayOfWeek();
		const hourlyData = await this.getOrderCountsByHour();

		const brandWiseOrderData = await this.orderService.getBrandWiseSales(query.fromDate, query.toDate);
		const staffWiseOrderData = await this.orderService.getEmployeeWiseSales();

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
		const averageAge = await this.customerService.getAverageAge();
		return averageAge;
	}

	async recVsMedCustomer() {
		const customerPercentage = this.orderService.getRecurringAndNewCustomerPercentage();
		return customerPercentage;
	}

	async calculateAverageSpendAndLoyaltyPoints() {
		const averageSpendWithLoyalty = await this.orderService.getAverageSpendAndLoyaltyPointsForAllCustomer();
		return averageSpendWithLoyalty;
	}

	async totalSales(query) {
		const { fromDate, toDate } = query;
		const formattedFromDate = dayjs(fromDate).format('YYYY-MM-DDT00:00:00.000[Z]');
		const formattedToDate = dayjs(toDate).format('YYYY-MM-DDT23:59:59.999[Z]');

		const { totalOrderAmount, totalDiscounts, totalOrders, orderAmountGrowth, discountGrowth, orderCountGrowth } =
			await this.orderService.totalOverViewCountForOrdersBetweenDate(formattedFromDate, formattedToDate);

		const dateWiseOrderData = await this.orderService.getOrderForEachDate(formattedFromDate, formattedToDate);

		return {
			totalOrderAmount,
			percentageOrderGrowth: orderAmountGrowth,
			totalOrders,
			dateWiseOrderData,
			totalDiscounts,
			discountGrowth,
			orderCountGrowth,
		};
	}

	async getOrderCountsByDayOfWeek() {
		const orderCountsByDayOfWeek = await this.orderService.getWeeklyBusiestDataForSpecificRange();
		return orderCountsByDayOfWeek;
	}

	async getOrderCountsByHour() {
		const orderCountsByHour = await this.orderService.getHourWiseDateForSpecificDateRange();

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
}
