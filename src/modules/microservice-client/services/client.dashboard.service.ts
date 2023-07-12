import { Injectable } from '@nestjs/common';
import { ClientCustomerService } from './client.customer.service';
import { ClientOrderService } from './client.order.service';
import * as dayjs from 'dayjs';
import { Types } from 'mongoose';

@Injectable()
export class ClientDashboardService {
	constructor(
		private readonly customerService: ClientCustomerService,
		private readonly orderService: ClientOrderService
	) {}

	async getCalculatedData(
		req,
		storeId: Types.ObjectId,
		query: { fromDate: string; toDate: string }
	) {
		const averageAge = await this.calculateAverageAge(
			storeId,
			query.fromDate,
			query.toDate
		);

		const { averageSpend, loyaltyPointsConverted } =
			await this.calculateAverageSpendAndLoyaltyPoints(
				storeId,
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
		} = await this.totalSales(storeId, query);

		const topCategory = await this.topSellingCategory(
			storeId,
			query.fromDate,
			query.toDate
		);
		const { returningCustomer: returningCustomer, newCustomer } =
			await this.recVsMedCustomer(storeId, query.fromDate, query.toDate);
		const weekOrders = await this.getOrderCountsByDayOfWeek(
			storeId,
			query.fromDate,
			query.toDate
		);
		const hourlyData = await this.getOrderCountsByHour(
			storeId,
			query.fromDate,
			query.toDate
		);

		const brandWiseOrderData = await this.orderService.getBrandWiseSales(
			storeId,
			query.fromDate,
			query.toDate
		);
		const staffWiseOrderData = await this.orderService.getEmployeeWiseSales(
			storeId,
			query.fromDate,
			query.toDate
		);

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

	async calculateAverageAge(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const averageAge = await this.customerService.getAverageAge(
			storeId,
			fromDate,
			toDate
		);
		return averageAge;
	}

	async recVsMedCustomer(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const customerPercentage =
			this.orderService.getRecurringAndNewCustomerPercentage(
				storeId,
				fromDate,
				toDate
			);
		return customerPercentage;
	}

	async calculateAverageSpendAndLoyaltyPoints(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const averageSpendWithLoyalty =
			await this.orderService.getAverageSpendAndLoyaltyPointsForAllCustomer(
				storeId,
				fromDate,
				toDate
			);
		return averageSpendWithLoyalty;
	}

	async totalSales(storeId: Types.ObjectId, query) {
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
			totalOrders,
			orderAmountGrowth,
			discountGrowth,
			orderCountGrowth,
		} = await this.orderService.totalOverViewCountForOrdersBetweenDate(
			storeId,
			formattedFromDate,
			formattedToDate
		);

		const dateWiseOrderData = await this.orderService.getOrderForEachDate(
			storeId,
			formattedFromDate,
			formattedToDate
		);

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

	async getOrderCountsByDayOfWeek(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const orderCountsByDayOfWeek =
			await this.orderService.getWeeklyBusiestDataForSpecificRange(
				storeId,
				fromDate,
				toDate
			);
		return orderCountsByDayOfWeek;
	}

	async getOrderCountsByHour(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const orderCountsByHour =
			await this.orderService.getHourWiseDateForSpecificDateRange(
				storeId,
				fromDate,
				toDate
			);

		return orderCountsByHour;
	}

	async topSellingCategory(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const topCategory = await this.orderService.getTopCategory(
			storeId,
			fromDate,
			toDate
		);
		return topCategory;
	}
}
