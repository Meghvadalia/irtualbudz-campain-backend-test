import { Injectable } from '@nestjs/common';
import { ClientCustomerService } from './client.customer.service';
import { ClientOrderService } from './client.order.service';
import * as dayjs from 'dayjs';
import { Types } from 'mongoose';
import { ClientStoreService } from './client.store.service';
import { getStoreTimezoneDateRange } from 'src/utils/time.utils';

@Injectable()
export class ClientDashboardService {
	constructor(
		private readonly customerService: ClientCustomerService,
		private readonly orderService: ClientOrderService,
		private readonly storeService: ClientStoreService
	) {}

	async getCalculatedData(
		req,
		storeId: Types.ObjectId,
		query: { fromDate: string; toDate: string }
	) {
		let storeData = await this.storeService.storeById(storeId.toString());

		const { formattedFromDate, formattedToDate } =
			getStoreTimezoneDateRange(
				query.fromDate,
				query.toDate,
				storeData.timeZone
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
			formattedFromDate,
			formattedToDate
		);
		const { returningCustomer: returningCustomer, newCustomer } =
			await this.recVsMedCustomer(
				storeId,
				formattedFromDate,
				formattedToDate
			);
		const weekOrders = await this.getOrderCountsByDayOfWeek(
			storeId,
			formattedFromDate,
			formattedToDate
		);
		const hourlyData = await this.getOrderCountsByHour(
			storeId,
			formattedFromDate,
			formattedToDate
		);

		const brandWiseOrderData = await this.orderService.getBrandWiseSales(
			storeId,
			formattedFromDate,
			formattedToDate
		);
		const staffWiseOrderData = await this.orderService.getEmployeeWiseSales(
			storeId,
			formattedFromDate,
			formattedToDate
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
		fromDate: Date,
		toDate: Date
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
		fromDate: Date,
		toDate: Date
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
		fromDate: Date,
		toDate: Date
	) {
		const averageSpendWithLoyalty =
			await this.orderService.getAverageSpendAndLoyaltyPointsForAllCustomer(
				storeId,
				fromDate,
				toDate
			);
		return averageSpendWithLoyalty;
	}

	async totalSales(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
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
		fromDate: Date,
		toDate: Date
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
		fromDate: Date,
		toDate: Date
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
		fromDate: Date,
		toDate: Date
	) {
		const topCategory = await this.orderService.getTopCategory(
			storeId,
			fromDate,
			toDate
		);
		return topCategory;
	}
}
