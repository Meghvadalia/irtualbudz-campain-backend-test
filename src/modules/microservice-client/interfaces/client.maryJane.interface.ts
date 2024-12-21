interface TopSellingCategoryProductCount {
    category: string;
    productCount: number;
}

interface ProductWiseSalesData {
    totalAmount: number;
    productName: string;
}

interface TopDiscountedProduct {
    productName: string;
    totalDiscountAmount: number;
    totalSales: number;
    totalProductDiscounts: number;
    sku: string;
    percentage: number;
}

interface TopUsedCoupon {
    promoName: string;
    percentage: number;
}

interface TopTHCProduct {
    productName: string;
    thcDetails: Array<{
        name: string;
        lowerRange: number;
        upperRange: number;
        unitOfMeasure: string;
        unitOfMeasureToGramsMultiplier: number | null;
        _id: string;
    }>;
    productPictureURL: string;
}

interface SalesData {
    topSellingCategoryProductCount: TopSellingCategoryProductCount[];
    productWiseSalesData: ProductWiseSalesData[];
    topDiscountedProduct?: TopDiscountedProduct[];
    topUsedCoupon?: TopUsedCoupon[];
    topTHCProducts: TopTHCProduct[];
}
