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
		const formattedFromDate = dayjs(query.fromDate).format(
			'YYYY-MM-DDT00:00:00.000[Z]'
		);
		const formattedToDate = dayjs(query.toDate).format(
			'YYYY-MM-DDT23:59:59.999[Z]'
		);

		const averageAge = await this.calculateAverageAge(
			storeId,
			formattedFromDate,
			formattedToDate
		);

		const {
			averageSpend,
			loyaltyPointsConverted,
			averageSpendGrowth,
			loyaltyPointsConversionGrowth,
		} = await this.calculateAverageSpendAndLoyaltyPoints(
			storeId,
			formattedFromDate,
			formattedToDate
		);

		const {
			totalOrderAmount,
			percentageOrderGrowth,
			totalOrders,
			dateWiseOrderData,
			totalDiscounts,
			discountGrowth,
			orderCountGrowth,
		} = await this.totalSales(storeId, formattedFromDate, formattedToDate);

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
		const averageCartSize = await this.orderService.averageCartSize(
			storeId,
			formattedFromDate,
			formattedToDate
		);
		const topDiscountedProduct = await this.orderService.topDiscountedItem(
			storeId,
			formattedFromDate,
			formattedToDate
		);
		const topUsedCoupon = await this.orderService.topDiscountedCoupon(
			storeId,
			formattedFromDate,
			formattedToDate
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
				age: averageAge,
				averageSpend: {
					averageSpend,
					averageSpendGrowth,
				},
				cart: averageCartSize,
				loyaltyPoints: {
					loyaltyPointsConverted,
					loyaltyPointsConversionGrowth,
				},
				topCategory,
				recOrMedCustomer: {
					newCustomer: newCustomer,
					returningCustomer: returningCustomer,
				},
			},
			sales: {
				brandWiseSalesData: brandWiseOrderData,
				topDiscountedProduct,
				topUsedCoupon,
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

	async totalSales(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string
	) {
		const {
			totalOrderAmount,
			totalDiscounts,
			totalOrders,
			orderAmountGrowth,
			discountGrowth,
			orderCountGrowth,
		} = await this.orderService.totalOverViewCountForOrdersBetweenDate(
			storeId,
			fromDate,
			toDate
		);

		const dateWiseOrderData = await this.orderService.getOrderForEachDate(
			storeId,
			fromDate,
			toDate
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
