import { Injectable } from '@nestjs/common';
import { ClientCustomerService } from './client.customer.service';
import { ClientOrderService } from './client.order.service';
import { Types } from 'mongoose';
import { ClientStoreService } from './client.store.service';
import { getStoreTimezoneDateRange } from 'src/utils/time.utils';
import { RpcException } from '@nestjs/microservices';
import { dynamicCatchException } from 'src/utils/error.utils';

@Injectable()
export class ClientDashboardService {
	constructor(
		private readonly customerService: ClientCustomerService,
		private readonly orderService: ClientOrderService,
		private readonly storeService: ClientStoreService
	) {}

	async getCalculatedData(
		storeId: Types.ObjectId,
		query: { fromDate: string; toDate: string; goalFlag?: string },
		campaignId?: Types.ObjectId,
		audienceTracking?: boolean
	) {
		const storeData = await this.storeService.storeById(storeId.toString());
		if (!storeData) {
			throw new RpcException('Store not found');
		}

		const { formattedFromDate, formattedToDate } = getStoreTimezoneDateRange(
			query.fromDate,
			query.toDate,
			storeData.timeZone
		);
		const averageAge = await this.calculateAverageAge(storeId, formattedFromDate, formattedToDate);

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
			graphAndSummaryData,
			totalDiscounts,
			discountGrowth,
			orderCountGrowth,
			// actionData,
		} = await this.totalSales(
			storeId,
			formattedFromDate,
			formattedToDate,
			query.goalFlag,
			campaignId,
			audienceTracking
		);

		const topCategory = await this.topSellingCategory(storeId, formattedFromDate, formattedToDate);
		const {
			returningCustomer,
			newCustomer,
			newCustomerAverageSpend,
			recurringCustomerAverageSpend,
		} = await this.recVsMedCustomer(storeId, formattedFromDate, formattedToDate);
		const registerdVsNonRegisteredCustomers = await this.registerdVsNonRegisteredCustomers(
			storeId,
			formattedFromDate,
			formattedToDate
		);
		const weekOrders = await this.getOrderCountsByDayOfWeek(
			storeId,
			formattedFromDate,
			formattedToDate
		);
		const hourlyData = await this.getOrderCountsByHour(storeId, formattedFromDate, formattedToDate);

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
		const { newCustomersByMonth, totalCustomerForCurrentYear } = await this.getCustomerAnalytics(
			storeId
		);
		const { newCustomers, returningCustomers } =
			await this.orderService.recurringVsNewCustomerTopCategory(
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
				// summary: actionData,
			},
			graphAndSummaryData,

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

				recVsMedAverageSpend: {
					recurringCustomerAverageSpend,
					newCustomerAverageSpend,
				},
				registerdVsNonRegisteredCustomers,
				recVsMedTopCategory: {
					newCustomers,
					returningCustomers,
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
				newCustomersByMonth,
				totalCustomerForCurrentYear,
			},
		};
	}

	async calculateAverageAge(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		const averageAge = await this.customerService.getAverageAge(storeId, fromDate, toDate);
		return averageAge;
	}

	async returningVsNewCustomerTopCategory(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		const topCategory = await this.orderService.recurringVsNewCustomerTopCategory(
			storeId,
			fromDate,
			toDate
		);
		return topCategory;
	}

	async recVsMedCustomer(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		const customerPercentage = await this.orderService.getRecurringAndNewCustomerPercentage(
			storeId,
			fromDate,
			toDate
		);
		return customerPercentage;
	}

	async registerdVsNonRegisteredCustomers(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		const customers = await this.orderService.getRegisteredVsNonRegisteredCustomers(
			storeId,
			fromDate,
			toDate
		);
		return customers;
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
	async getCustomerAnalytics(storeId: Types.ObjectId) {
		const { newCustomersByMonth } = await this.customerService.getNewCustomersByMonth(storeId);
		const { totalCustomerForCurrentYear } = await this.customerService.getTotalCurrentYearCustomer(
			storeId
		);
		return { newCustomersByMonth, totalCustomerForCurrentYear };
	}
	async totalSales(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date,
		goalFlag?: string,
		campaignId?: Types.ObjectId,
		audienceTracking?: boolean
	) {
		try {
			const {
				totalOrderAmount,
				totalDiscounts,
				totalOrders,
				orderAmountGrowth,
				discountGrowth,
				orderCountGrowth,
			} = await this.orderService.totalOverViewCountForOrdersBetweenDate(storeId, fromDate, toDate);

			const graphAndSummaryData = await this.orderService.getOrderForEachDate(
				storeId,
				fromDate,
				toDate,
				goalFlag,
				campaignId,
				audienceTracking
			);

			// const actionData = await this.orderService.getActionData(campaignId, fromDate, toDate, storeId);
			return {
				totalOrderAmount,
				percentageOrderGrowth: orderAmountGrowth,
				totalOrders,
				totalDiscounts,
				discountGrowth,
				orderCountGrowth,
				// actionData,
				graphAndSummaryData,
			};
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getOrderCountsByDayOfWeek(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		try {
			const orderCountsByDayOfWeek = await this.orderService.getWeeklyBusiestDataForSpecificRange(
				storeId,
				fromDate,
				toDate
			);
			return orderCountsByDayOfWeek;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getOrderCountsByHour(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		try {
			const orderCountsByHour = await this.orderService.getHourWiseDateForSpecificDateRange(
				storeId,
				fromDate,
				toDate
			);
			return orderCountsByHour;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async topSellingCategory(storeId: Types.ObjectId, fromDate: Date, toDate: Date) {
		try {
			const topCategory = await this.orderService.getTopCategory(storeId, fromDate, toDate);
			return topCategory;
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
