import { Injectable } from '@nestjs/common';
import { CustomerService } from '../services/customer.service';
import { OrderService } from '../services/order.service';
import * as dayjs from 'dayjs';

@Injectable()
export class DashboardService {
	constructor(private readonly customerService: CustomerService, private readonly orderService: OrderService) {}

	async getCalculatedData(locationId: string, query: { fromDate: string; toDate: string }) {
		const averageAge = await this.calculateAverageAge();

		const { averageSpend, loyaltyPointsConverted } = await this.calculateAverageSpendAndLoyaltyPoints(locationId);

		const {
			totalOrderAmount,
			percentageOrderGrowth,
			totalOrders,
			dateWiseOrderData,
			totalDiscounts,
			discountGrowth,
			orderCountGrowth,
		} = await this.totalSales(locationId, query);

		const topCategory = await this.topSellingCategory(locationId);
		const { returningCustomer: returningCustomer, newCustomer } = await this.recVsMedCustomer(locationId);
		const weekOrders = await this.getOrderCountsByDayOfWeek(locationId);
		const hourlyData = await this.getOrderCountsByHour(locationId);

		const brandWiseOrderData = await this.orderService.getBrandWiseSales(locationId);
		const staffWiseOrderData = await this.orderService.getEmployeeWiseSales(locationId);

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

	async recVsMedCustomer(locationId: string) {
		const customerPercentage = this.orderService.getRecurringAndNewCustomerPercentage(locationId);
		return customerPercentage;
	}

	async calculateAverageSpendAndLoyaltyPoints(locationId: string) {
		const averageSpendWithLoyalty = await this.orderService.getAverageSpendAndLoyaltyPointsForAllCustomer(locationId);
		return averageSpendWithLoyalty;
	}

	async totalSales(locationId, query) {
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

	async getOrderCountsByDayOfWeek(locationId: string) {
		const orderCountsByDayOfWeek = await this.orderService.getWeeklyBusiestDataForSpecificRange(locationId);
		return orderCountsByDayOfWeek;
	}

	async getOrderCountsByHour(locationId: string) {
		const orderCountsByHour = await this.orderService.getHourWiseDateForSpecificDateRange(locationId);

		return orderCountsByHour;
	}

	async topSellingCategory(locationId: string) {
		const topCategory = await this.orderService.getTopCategory(locationId);
		return topCategory;
	}
}
