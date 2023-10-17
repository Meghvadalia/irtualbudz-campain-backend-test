import { ISuggestions, Suggestions } from 'src/model/suggestions/interfaces/suggestions.interface';
import { DATABASE_COLLECTION } from '../constants';

export const SuggestionList: ISuggestions[] = [
	{
		name: Suggestions.CATEGORY_SATURATION,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.EXPIRING_PRODUCTS,
		isActive: true,
		isDeleted: false,
		dateOffset: 60,
		display: true,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
					expirationDate: {
						$gte: '',
						$lte: '',
					},
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'productData',
				},
			},
			{
				$unwind: {
					path: '$productData',
				},
			},
			{
				$project: {
					_id: '$productData._id',
					name: '$productData.productName',
					brand: '$productData.brand',
					category: '$productData.category',
					sellable: '$forSale',
				},
			},
			{
				$sort: {
					expirationDate: -1,
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
		],
	},
	{
		name: Suggestions.SLOW_MOVING_ITEMS,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.ORDER,
		dateOffset: -7,
		display: true,
		condition: [
			{
				$match: {
					storeId: '',
					orderStatus: 'sold',
					posCreatedAt: {
						$gte: '',
					},
				},
			},
			{ $unwind: '$itemsInCart' },
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: 'itemsInCart',
					foreignField: '_id',
					as: 'cartData',
				},
			},
			{
				$unwind: '$cartData',
			},
			{
				$project: {
					_id: 0,
					orderId: '$_id',
					'cartData.sku': 1,
				},
			},
			{
				$group: {
					_id: '$cartData.sku',
					orderIdList: { $push: '$orderId' },
				},
			},
			{
				$addFields: {
					orderCount: {
						$size: '$orderIdList',
					},
				},
			},
			{
				$sort: {
					orderCount: 1,
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: '_id',
					foreignField: 'sku',
					as: 'productInfo',
				},
			},
			{
				$unwind: '$productInfo',
			},
			{
				$project: {
					_id: '$productInfo._id',
					name: '$productInfo.productName',
					brand: '$productInfo.brand',
					category: '$productInfo.category',
					sku: '$_id',
					orderIdList: 1,
				},
			},
			{ $skip: '' },
			{ $limit: '' },
		],
	},
	{
		name: Suggestions.BRANDS,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.CATEGORY,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.CONTESTS,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.REFER_A_FRIEND,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.EXCESS_INVENTORY,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		display: true,
		condition: [
			{
				$match: {
					storeId: '',
				},
			},
			{
				$group: {
					_id: '$productId',
					totalQuantity: { $sum: '$quantity' },
					sellable: { $first: '$forSale' },
				},
			},
			{
				$sort: { totalQuantity: -1 },
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: '_id',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$unwind: '$product',
			},
			{
				$match: {
					'product.productName': { $ne: '$0.10 Bag Fee' },
				},
			},
			{
				$project: {
					name: '$product.productName',
					brand: '$product.brand',
					category: '$product.category',
					sellable: 1,
				},
			},
		],
	},
	{
		name: Suggestions.NEW_INVENTORY_ITEM,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		dateOffset: -30,
		display: true,
		condition: [
			{
				$match: {
					storeId: '',
					createdAt: {
						$gte: '',
						$lte: '',
					},
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'productData',
				},
			},
			{
				$unwind: {
					path: '$productData',
				},
			},
			{
				$project: {
					_id: '$productData._id',
					name: '$productData.productName',
					brand: '$productData.brand',
					category: '$productData.category',
					sellable: '$forSale',
				},
			},
			{
				$sort: {
					name: 1,
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
		],
	},
	{
		name: Suggestions.HIGHEST_PROFITABLE_ITEMS,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		display: true,
		condition: [
			{
				$match: {
					storeId: '',
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$unwind: '$product',
			},
			{
				$project: {
					_id: '$product._id',
					name: '$product.productName',
					// sku: '$product.sku',
					profit: { $subtract: ['$priceInMinorUnits', '$costInMinorUnits'] },
					brand: '$product.brand',
					category: '$product.category',
					sellable: '$forSale',
				},
			},
			// {
			// 	$group: {
			// 		_id: '$sku',
			// 		productName: { $first: '$productName' },
			// 		totalProfit: { $sum: '$profit' },
			// 	},
			// },
			// {
			// 	$sort: { totalProfit: -1 },
			// },
			{
				$sort: { profit: -1 },
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$project: {
					_id: 1,
					name: 1,
					brand: 1,
					category: 1,
					sellable: 1,
				},
			},
		],
	},
	{
		name: Suggestions.CO_OP_WITH_PARTNER_BRAND,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.HAPPY_HOUR_SPECIALS,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.RECEIPT_FOR_DISCOUNTS,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: Suggestions.BUNDLE_ITEMS,
		isActive: true,
		isDeleted: false,
		display: true,
	},
	{
		name: 'Expiring Products with unique brand',
		isActive: true,
		isDeleted: false,
		dateOffset: 60,
		display: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
					expirationDate: {
						$gte: '',
						$lte: '',
					},
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'productData',
				},
			},
			{
				$unwind: {
					path: '$productData',
				},
			},
			{
				$group: {
					_id: '$productData.brand',
				},
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
			{
				$sort: {
					name: 1,
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
		],
	},
	{
		name: 'Expiring Products with unique category',
		isActive: true,
		isDeleted: false,
		display: false,
		dateOffset: 60,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
					expirationDate: {
						$gte: '',
						$lte: '',
					},
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'productData',
				},
			},
			{
				$unwind: {
					path: '$productData',
				},
			},
			{
				$group: {
					_id: '$productData.category',
				},
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
			{
				$sort: {
					name: 1,
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
		],
	},
	{
		name: 'Slow moving items with unique brand',
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.ORDER,
		dateOffset: -7,
		display: false,
		condition: [
			{
				$match: {
					storeId: '',
					orderStatus: 'sold',
					posCreatedAt: {
						$gte: '',
					},
				},
			},
			{ $unwind: '$itemsInCart' },
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: 'itemsInCart',
					foreignField: '_id',
					as: 'cartData',
				},
			},
			{
				$unwind: '$cartData',
			},

			{
				$project: {
					_id: 0,
					orderId: '$_id',
					'cartData.sku': 1,
				},
			},
			{
				$group: {
					_id: '$cartData.sku',
					orderIdList: { $push: '$orderId' },
				},
			},
			{
				$addFields: {
					orderCount: {
						$size: '$orderIdList',
					},
				},
			},
			{
				$sort: {
					orderCount: 1,
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: '_id',
					foreignField: 'sku',
					as: 'productInfo',
				},
			},
			{
				$unwind: '$productInfo',
			},
			{
				$group: {
					_id: '$productInfo.brand',
				},
			},
			{ $skip: '' },
			{ $limit: '' },
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
		],
	},
	{
		name: 'Slow moving items with unique category',
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.ORDER,
		display: false,
		dateOffset: -7,
		condition: [
			{
				$match: {
					storeId: '',
					orderStatus: 'sold',
					posCreatedAt: {
						$gte: '',
					},
				},
			},
			{ $unwind: '$itemsInCart' },
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: 'itemsInCart',
					foreignField: '_id',
					as: 'cartData',
				},
			},
			{
				$unwind: '$cartData',
			},

			{
				$project: {
					_id: 0,
					orderId: '$_id',
					'cartData.sku': 1,
				},
			},
			{
				$group: {
					_id: '$cartData.sku',
					orderIdList: { $push: '$orderId' },
				},
			},
			{
				$addFields: {
					orderCount: {
						$size: '$orderIdList',
					},
				},
			},
			{
				$sort: {
					orderCount: 1,
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: '_id',
					foreignField: 'sku',
					as: 'productInfo',
				},
			},
			{
				$unwind: '$productInfo',
			},
			{
				$group: {
					_id: '$productInfo.category',
				},
			},
			{ $skip: '' },
			{ $limit: '' },
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
		],
	},
	{
		name: 'Excess Inventory with unique brand',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
				},
			},
			{
				$group: {
					_id: '$productId',
					totalQuantity: { $sum: '$quantity' },
				},
			},
			{
				$sort: { totalQuantity: -1 },
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: '_id',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$unwind: '$product',
			},
			{
				$match: {
					'product.productName': { $ne: '$0.10 Bag Fee' },
				},
			},
			{
				$group: {
					_id: '$product.brand',
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
			{
				$sort: {
					name: 1,
				},
			},
		],
	},
	{
		name: 'Excess Inventory with unique category',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
				},
			},
			{
				$group: {
					_id: '$productId',
					totalQuantity: { $sum: '$quantity' },
				},
			},
			{
				$sort: { totalQuantity: -1 },
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: '_id',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$unwind: '$product',
			},
			{
				$match: {
					'product.productName': { $ne: '$0.10 Bag Fee' },
				},
			},
			{
				$group: {
					_id: '$product.category',
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
			{
				$sort: {
					name: 1,
				},
			},
		],
	},
	{
		name: 'New Inventory with unique brand',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		dateOffset: -30,
		condition: [
			{
				$match: {
					storeId: '',
					createdAt: {
						$gte: '',
						$lte: '',
					},
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'productData',
				},
			},
			{
				$unwind: {
					path: '$productData',
				},
			},
			{
				$group: {
					_id: '$productData.brand',
				},
			},
			{
				$match: {
					_id: {
						$ne: null,
					},
				},
			},
			{
				$sort: {
					_id: 1,
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
		],
	},
	{
		name: 'New Inventory with unique category',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		dateOffset: -30,
		condition: [
			{
				$match: {
					storeId: '',
					createdAt: {
						$gte: '',
						$lte: '',
					},
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'productData',
				},
			},
			{
				$unwind: {
					path: '$productData',
				},
			},
			{
				$group: {
					_id: '$productData.category',
				},
			},
			{
				$sort: {
					_id: 1,
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
		],
	},
	{
		name: 'Highest profitable Items with unique brand',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$unwind: '$product',
			},
			{
				$project: {
					profit: { $subtract: ['$priceInMinorUnits', '$costInMinorUnits'] },
					brand: '$product.brand',
				},
			},
			{
				$sort: { profit: -1 },
			},
			{
				$group: {
					_id: '$brand',
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
		],
	},
	{
		name: 'Highest profitable Items with unique category',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
					quantity: {
						$gt: 0,
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'productId',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$unwind: '$product',
			},
			{
				$project: {
					profit: { $subtract: ['$priceInMinorUnits', '$costInMinorUnits'] },
					category: '$product.category',
				},
			},
			{
				$sort: { profit: -1 },
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$group: {
					_id: '$category',
				},
			},
			{
				$skip: '',
			},
			{
				$limit: '',
			},
			{
				$project: {
					_id: 0,
					name: '$_id',
				},
			},
		],
	},
	{
		name: Suggestions.BIG_SPENDER_TOP_5_MARGINS,
		display: true,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
	},
	{
		name: Suggestions.FREQUENT_FLYER_TOP_5_MARGINS,
		display: true,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
	},
	{
		name: Suggestions.GEN_X_TOP_5_MARGINS,
		display: true,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
	},
	{
		name: Suggestions.GEN_Z_TOP_5_MARGINS,
		display: true,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
	},
	{
		name: 'Top-5 margins',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
		condition: [
			{
				$match: {
					audienceId: '',
					storeId: '',
				},
			},
			{
				$group: {
					_id: "$customerId",
				}
			},
			{
				// Stage 3: Lookup customers in the orders collection
				$lookup: {
					from: DATABASE_COLLECTION.ORDER,
					localField: "_id",
					foreignField: "customerId",
					as: "customerOrders"
				},
			},
			{
				// Stage 4: Unwind the customerOrders array
				$unwind: "$customerOrders"
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: "customerOrders.itemsInCart",
					foreignField: "_id",
					as: "cartItems"
				}
			},
			{
				$unwind: "$cartItems"
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.INVENTORY,
					localField: "cartItems.sku",
					foreignField: "sku",
					as: "inventoryData"
				}
			},
			{
				$unwind: "$inventoryData"
			},
			{
				$project: {
					_id: 0,
					customerId: "$_id",
					grossProfit: {
						$subtract: ["$inventoryData.priceInMinorUnits", "$inventoryData.costInMinorUnits"]
					},
					productName: '$cartItems.productName',
					productId: '$inventoryData.productId'
				}
			},
			{
				$match: {
					grossProfit: { $ne: null }
				}
			},
			{
				$group: {
					_id: "$customerId",
					productName: { $first: "$productName" },
					grossProfit: { $first: "$grossProfit" },
					productId:{$first:"$productId"}
					
				}
			},
			{
				$sort: {
					grossProfit: -1
				}
			},
			{
				$limit: 5
			},
			{
				$project: {
					name: "$productName",
					_id:"$productId"
				 }
			}
		],
	},
	{
		name: 'Top-5 margins with unique brand',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
		condition: [
			{
				$match: {
					audienceId: '',
					storeId: '',
				},
			},
			{
				$group: {
					_id: "$customerId",
				}
			},
			{
				// Stage 3: Lookup customers in the orders collection
				$lookup: {
					from: DATABASE_COLLECTION.ORDER,
					localField: "_id",
					foreignField: "customerId",
					as: "customerOrders"
				},
			},
			{
				// Stage 4: Unwind the customerOrders array
				$unwind: "$customerOrders"
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: "customerOrders.itemsInCart",
					foreignField: "_id",
					as: "cartItems"
				}
			},
			{
				$unwind: "$cartItems"
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.INVENTORY,
					localField: "cartItems.sku",
					foreignField: "sku",
					as: "inventoryData"
				}
			},
			{
				$unwind: "$inventoryData"
			},
			{
				$project: {
					_id: 0,
					customerId: "$_id",
					grossProfit: {
						$subtract: ["$inventoryData.priceInMinorUnits", "$inventoryData.costInMinorUnits"]
					},
					name: '$cartItems.title2'
				}
			},
			{
				// Stage 11: Filter out documents with null grossProfit
				$match: {
					grossProfit: { $ne: null }
				}
			},
			{
				// Stage 14: Group by brand to get distinct brands
				$group: {
					_id: "$name",
					grossProfit: { $first: "$grossProfit" }
				},
			},
			{
				// Stage 13: Sort by grossProfit in descending order
				$sort: {
					grossProfit: -1
				}
			},
			{
				// Stage 14: Limit the number of results to 5
				$limit: 5
			},
			{
				$project: {
					_id: 0,
					name: "$_id"
				 }
			}
		],
	},
	{
		name: 'Top-5 margins with unique category',
		display: false,
		isActive: true,
		isDeleted: false,
		collectionName: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
		condition: [
			{
				$match: {
					audienceId: '',
					storeId: '',
				},
			},
			{
				$group: {
					_id: "$customerId",
				}
			},
			{
				// Stage 3: Lookup customers in the orders collection
				$lookup: {
					from: DATABASE_COLLECTION.ORDER,
					localField: "_id",
					foreignField: "customerId",
					as: "customerOrders"
				},
			},
			{
				// Stage 4: Unwind the customerOrders array
				$unwind: "$customerOrders"
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: "customerOrders.itemsInCart",
					foreignField: "_id",
					as: "cartItems"
				}
			},
			{
				$unwind: "$cartItems"
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.INVENTORY,
					localField: "cartItems.sku",
					foreignField: "sku",
					as: "inventoryData"
				}
			},
			{
				$unwind: "$inventoryData"
			},
			{
				$project: {
					_id: 0,
					customerId: "$_id",
					grossProfit: {
						$subtract: ["$inventoryData.priceInMinorUnits", "$inventoryData.costInMinorUnits"]
					},
					name: '$cartItems.category'
				}
			},
			{
				// Stage 11: Filter out documents with null grossProfit
				$match: {
					grossProfit: { $ne: null }
				}
			},
			// {
			// 	// Stage 12: Group by customerId to remove duplicates
			// 	$group: {
			// 		_id: "$customerId",
			// 		name: { $first: "$name" },
			// 		grossProfit: { $first: "$grossProfit" }
			// 	}
			// },
			{
				// Stage 14: Group by brand to get distinct brands
				$group: {
					_id: "$name",
					grossProfit: { $first: "$grossProfit" }
				},
			},
			{
				// Stage 13: Sort by grossProfit in descending order
				$sort: {
					grossProfit: -1
				}
			},
			{
				// Stage 14: Limit the number of results to 5
				$limit: 5
			},
			{
				$project: {
					_id: 0,
					name: "$_id"
				 }
			}
		],
	},
];
