import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from 'src/microservices/order/entities/order.entity';
import { dynamicCatchException } from 'src/utils/error.utils';
import { ClientStoreService } from './client.store.service';
import { getStoreTimezoneDateRange } from 'src/utils/time.utils';
import { ClientOrderService } from './client.order.service';
import { MARY_JANE_DASHBOARD } from 'src/common/constants';

@Injectable()
export class MaryJaneService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
        private readonly orderService: ClientOrderService,
        private readonly storeService: ClientStoreService,
	) {	}

	async calculateSalesData(
		storeId: Types.ObjectId,
		fromDate: string,
		toDate: string,
	): Promise<SalesData> {
		try {
			const storeData = await this.storeService.storeById(storeId.toString());

			if (!storeData) {
				return {
					topSellingCategoryProductCount: [],
					productWiseSalesData: [],
					topDiscountedProduct: [],
					topUsedCoupon: [],
					topTHCProducts: []
				};
			}
    
			const { formattedFromDate, formattedToDate } = getStoreTimezoneDateRange(
				fromDate,
				toDate,
				storeData.timeZone
			);
    
			const salesData: SalesData = {
				topSellingCategoryProductCount: await this.orderService.topSellingCategoryProductCount(
					storeId,
					formattedFromDate,
					formattedToDate,
					MARY_JANE_DASHBOARD.TOP_SELLING_CATEGORY_PRODUCT_COUNT
				),
				productWiseSalesData: await this.orderService.getProductWiseSales(
					storeId,
					formattedFromDate,
					formattedToDate,
					MARY_JANE_DASHBOARD.PRODUCT_WISE_SALES_DATA
				),				
				topTHCProducts: await this.orderService.getTopProductTHC(
					storeId,
					formattedFromDate,
					formattedToDate,
					MARY_JANE_DASHBOARD.TOP_PRODUCT_THC
				)
			};
    
			return salesData;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error);
			return {
				topSellingCategoryProductCount: [],
				productWiseSalesData: [],
				topDiscountedProduct: [],
				topUsedCoupon: [],
				topTHCProducts: []
			};
		}
	}
      
}