import { Injectable } from '@nestjs/common';
import { ClientCustomerService } from './client.customer.service';
import { ClientOrderService } from './client.order.service';
import * as dayjs from 'dayjs';
import { Types } from 'mongoose';

@Injectable()
export class ClientDashboardService {
	constructor(private readonly customerService: ClientCustomerService, private readonly orderService: ClientOrderService) {}

	async getCalculatedData(locationId: Types.ObjectId, query: { fromDate: string; toDate: string }) {
		const averageAge = await this.calculateAverageAge(locationId, query.fromDate, query.toDate);

		const { averageSpend, loyaltyPointsConverted } = await this.calculateAverageSpendAndLoyaltyPoints(
			locationId,
			query.fromDate,
			query.toDate
		);

		const {
			totalOrderAmount,
			percentageOrderGrowth,
			totalOrders,
			dateWiseOrderData,
			totalDiscounts,
			discountGrowth,
			orderCountGrowth,
		} = await this.totalSales(locationId, query);

		const topCategory = await this.topSellingCategory(locationId, query.fromDate, query.toDate);
		const { returningCustomer: returningCustomer, newCustomer } = await this.recVsMedCustomer(
			locationId,
			query.fromDate,
			query.toDate
		);
		const weekOrders = await this.getOrderCountsByDayOfWeek(locationId, query.fromDate, query.toDate);
		const hourlyData = await this.getOrderCountsByHour(locationId, query.fromDate, query.toDate);

		const brandWiseOrderData = await this.orderService.getBrandWiseSales(locationId, query.fromDate, query.toDate);
		const staffWiseOrderData = await this.orderService.getEmployeeWiseSales(locationId, query.fromDate, query.toDate);

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

	async calculateAverageAge(locationId: Types.ObjectId, fromDate: string, toDate: string) {
		const averageAge = await this.customerService.getAverageAge(locationId, fromDate, toDate);
		return averageAge;
	}

	async recVsMedCustomer(locationId: Types.ObjectId, fromDate: string, toDate: string) {
		const customerPercentage = this.orderService.getRecurringAndNewCustomerPercentage(locationId, fromDate, toDate);
		return customerPercentage;
	}

	async calculateAverageSpendAndLoyaltyPoints(locationId: Types.ObjectId, fromDate: string, toDate: string) {
		const averageSpendWithLoyalty = await this.orderService.getAverageSpendAndLoyaltyPointsForAllCustomer(
			locationId,
			fromDate,
			toDate
		);
		return averageSpendWithLoyalty;
	}

	async totalSales(locationId: Types.ObjectId, query) {
		const { fromDate, toDate } = query;
		const formattedFromDate = dayjs(fromDate).format('YYYY-MM-DDT00:00:00.000[Z]');
		const formattedToDate = dayjs(toDate).format('YYYY-MM-DDT23:59:59.999[Z]');

		const { totalOrderAmount, totalDiscounts, totalOrders, orderAmountGrowth, discountGrowth, orderCountGrowth } =
			await this.orderService.totalOverViewCountForOrdersBetweenDate(locationId, formattedFromDate, formattedToDate);

		const dateWiseOrderData = await this.orderService.getOrderForEachDate(locationId, formattedFromDate, formattedToDate);

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

	async getOrderCountsByDayOfWeek(locationId: Types.ObjectId, fromDate: string, toDate: string) {
		const orderCountsByDayOfWeek = await this.orderService.getWeeklyBusiestDataForSpecificRange(locationId, fromDate, toDate);
		return orderCountsByDayOfWeek;
	}

	async getOrderCountsByHour(locationId: Types.ObjectId, fromDate: string, toDate: string) {
		const orderCountsByHour = await this.orderService.getHourWiseDateForSpecificDateRange(locationId, fromDate, toDate);

		return orderCountsByHour;
	}

	async topSellingCategory(locationId: Types.ObjectId, fromDate: string, toDate: string) {
		const topCategory = await this.orderService.getTopCategory(locationId, fromDate, toDate);
		return topCategory;
	}
}
