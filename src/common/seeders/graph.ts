import { GOALSTYPES } from 'src/model/goals/interface/goals.interface';
import { ACTIONS } from './actions';
import { DATABASE_COLLECTION } from '../constants';

export const graphData = [
	{
		name: GOALSTYPES.IncreaseCartSize,
		condition: [
			{
				$match: {
					storeId: '',
					posCreatedAt: {
						$gte: '',
						$lte: '',
					},
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$posCreatedAt',
							timezone: '',
						},
					},
					Average: { $avg: '$totals.subTotal' },
				},
			},
			{
				$project: {
					date: '$_id',
					Average: { $round: ['$Average', 2] },
				},
			},
			{
				$sort: {
					date: 1,
				},
			},
			{
				$group: {
					_id: null, // Group all documents into a single group
					chartData: {
						$push: { date: '$date', Average: '$Average' },
					}, // Store daily averages with dates in an array
					TotalCount: { $sum: '$Average' }, // Calculate the total average
					FirstDayAverage: { $first: '$Average' }, // Get the average of the first day
					LastDayAverage: { $last: '$Average' }, // Get the average of the last day
				},
			},
			{
				$project: {
					_id: 0,
					chartData: 1,
					TotalCount: 1,
					PercentageChange: {
						$cond: {
							if: { $eq: ['$LastDayAverage', 0] },
							then: 0,
							else: {
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$LastDayAverage',
													'$FirstDayAverage',
												],
											},
											'$FirstDayAverage',
										],
									},
									100,
								],
							},
						},
					},
				},
			},
		],
		axes: [
			{
				xAxis: ['date'],
				yAxis: ['Average'],
			},
		],
	},
	{
		name: GOALSTYPES.IncreaseInStoreTraffic,
		condition: [
			{
				$match: {
					storeId: '',
					posCreatedAt: {
						$gte: '',
						$lte: '',
					},
					orderType: {
						$in: ['in-store', 'Pickup'],
					},
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$posCreatedAt',
							timezone: '',
						},
					},
					count: {
						$sum: 1,
					},
				},
			},
			{ $sort: { _id: 1 } },
			{
				$group: {
					_id: null,
					chartData: {
						$push: {
							date: '$_id',
							count: '$count',
						},
					},
					TotalCount: { $sum: '$count' },
					FirstDayCount: { $first: '$count' },
					LastDayCount: { $last: '$count' },
				},
			},
			{
				$project: {
					_id: 0,
					chartData: 1,
					TotalCount: 1,
					PercentageChange: {
						$cond: {
							if: { $eq: ['$LastDayCount', 0] },
							then: 0,
							else: {
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$LastDayCount',
													'$FirstDayCount',
												],
											},
											'$FirstDayCount',
										],
									},
									100,
								],
							},
						},
					},
				},
			},
		],
		axes: [
			{
				xAxis: ['date'],
				yAxis: ['count'],
			},
		],
	},
	{
		name: GOALSTYPES.IncreaseOnlineOrders,
		condition: [
			{
				$match: {
					storeId: '',
					posCreatedAt: {
						$gte: '',
						$lte: '',
					},
					orderType: {
						$nin: ['delivery', 'pickup'],
					},
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$posCreatedAt',
							timezone: '',
						},
					},
					count: {
						$sum: 1,
					},
				},
			},
			{
				$project: {
					date: '$_id',
					count: 1,
					_id: 0,
				},
			},
			{
				$sort: {
					date: 1,
				},
			},
			{
				$group: {
					_id: null, // Group all documents into a single group
					chartData: { $push: { date: '$date', count: '$count' } }, // Store daily counts with dates in an array
					TotalCount: { $sum: '$count' }, // Calculate the total count
					FirstDayCount: { $first: '$count' }, // Get the count of the first day
					LastDayCount: { $last: '$count' }, // Get the count of the last day
				},
			},
			{
				$project: {
					_id: 0,
					chartData: 1,
					TotalCount: 1,
					PercentageChange: {
						$cond: {
							if: { $eq: ['$LastDayCount', 0] },
							then: 0,
							else: {
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$LastDayCount',
													'$FirstDayCount',
												],
											},
											'$FirstDayCount',
										],
									},
									100,
								],
							},
						},
					},
				},
			},
		],
		axes: [
			{
				xAxis: ['date'],
				yAxis: ['count'],
			},
		],
	},
	{
		name: ACTIONS.INCREASE_MARGINS,
		condition: [
			{
				$match: {
					storeId: '',
					posCreatedAt: {
						$gte: '',
						$lte: '',
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: 'itemsInCart',
					foreignField: '_id',
					as: 'cartItems',
				},
			},
			{
				$unwind: '$cartItems',
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.INVENTORY,
					localField: 'cartItems.sku',
					foreignField: 'sku',
					as: 'inventoryData',
				},
			},
			{
				$unwind: '$inventoryData',
			},
			{
				$project: {
					_id: 1,
					posCreatedAt: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$posCreatedAt',
							timezone: '',
						},
					},
					grossProfit: {
						$subtract: [
							'$inventoryData.priceInMinorUnits',
							'$inventoryData.costInMinorUnits',
						],
					},
				},
			},
			{
				$group: {
					_id: '$posCreatedAt',
					totalGrossProfit: { $sum: '$grossProfit' },
				},
			},
			{
				$project: {
					_id: 0,
					date: '$_id',
					totalGrossProfit: { $divide: ['$totalGrossProfit', 100] },
				},
			},
			{
				$sort: { date: 1 },
			},
			{
				$group: {
					_id: null, // Group all documents into a single group
					TotalCount: { $sum: '$totalGrossProfit' }, // Calculate the total gross profit
					FirstDayGrossProfit: { $first: '$totalGrossProfit' }, // Get the profit of the first day
					LastDayGrossProfit: { $last: '$totalGrossProfit' }, // Get the profit of the last day
					chartData: {
						$push: {
							date: '$date',
							GrossProfit: '$totalGrossProfit',
						},
					}, // Store daily profits with dates in an array
				},
			},
			{
				$project: {
					_id: 0,
					chartData: 1,
					TotalCount: 1,
					PercentageChange: {
						$cond: {
							if: { $eq: ['$LastDayGrossProfit', 0] },
							then: 0,
							else: {
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$LastDayGrossProfit',
													'$FirstDayGrossProfit',
												],
											},
											'$FirstDayGrossProfit',
										],
									},
									100,
								],
							},
						},
					},
				},
			},
		],
		axes: [
			{
				xAxis: ['date'],
				yAxis: ['GrossProfit'],
			},
		],
	},
	{
		name: ACTIONS.REDUCE_INVENTORY,
		condition: [
			{
				$match: {
					storeId: '',
					posCreatedAt: {
						$gte: '',
						$lte: '',
					},
					$or: [
						{
							itemsInCart: {
								$in: [],
							},
						},
					],
				},
			},
			{
				$project: {
					date: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$posCreatedAt',
							timezone: '',
						},
					},
					itemCount: {
						$size: '$itemsInCart',
					},
				},
			},
			{
				$group: {
					_id: '$date',
					totalItems: {
						$sum: '$itemCount',
					},
				},
			},
			{
				$project: {
					_id: 0,
					date: '$_id',
					totalItems: 1,
				},
			},
			{
				$sort: {
					date: 1,
				},
			},
			{
				$group: {
					_id: null, // Group all documents into a single group
					TotalCount: { $sum: '$totalItems' }, // Calculate the total item count
					FirstDayItemCount: { $first: '$totalItems' }, // Get the item count of the first day
					LastDayItemCount: { $last: '$totalItems' }, // Get the item count of the last day
					chartData: {
						$push: { date: '$date', totalItems: '$totalItems' },
					}, // Store daily item counts with dates in an array
				},
			},
			{
				$project: {
					_id: 0,
					chartData: 1,
					TotalCount: 1,
					PercentageChange: {
						$cond: {
							if: { $eq: ['$LastDayItemCount', 0] },
							then: 0,
							else: {
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$LastDayItemCount',
													'$FirstDayItemCount',
												],
											},
											'$FirstDayItemCount',
										],
									},
									100,
								],
							},
						},
					},
				},
			},
		],
		axes: [
			{
				xAxis: ['date'],
				yAxis: ['totalItems'],
			},
		],
	},
	{
		name: ACTIONS.MARKET_SPECIFIC_BRAND,
		condition: [
			{
				$match: {
					storeId: '',
					posCreatedAt: {
						$gte: '',
						$lte: '',
					},
				},
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.CART,
					localField: 'itemsInCart',
					foreignField: '_id',
					as: 'carts',
				},
			},
			{
				$unwind: '$carts',
			},
			{
				$lookup: {
					from: DATABASE_COLLECTION.PRODUCT,
					localField: 'carts.sku',
					foreignField: 'sku',
					as: 'product',
				},
			},
			{
				$unwind: '$product',
			},
			{
				$match: {
					'product.brand': {
						$in: [],
					},
				},
			},
			{
				$group: {
					_id: {
						date: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$posCreatedAt',
								timezone: '',
							},
						},
						order: '$product.brand',
					},
					orderCount: {
						$sum: 1,
					},
				},
			},
			{
				$group: {
					_id: '$_id.date',
					orderCount: {
						$sum: '$orderCount',
					},
				},
			},
			{
				$project: {
					_id: 0,
					date: '$_id',
					orderCount: 1,
				},
			},
			{
				$sort: {
					date: 1,
				},
			},
			{
				$group: {
					_id: null, // Group all documents into a single group
					TotalCount: { $sum: '$orderCount' }, // Calculate the total order count
					FirstDayOrderCount: { $first: '$orderCount' }, // Get the order count of the first day
					LastDayOrderCount: { $last: '$orderCount' }, // Get the order count of the last day
					chartData: {
						$push: { date: '$date', order: '$orderCount' },
					}, // Store daily order counts with dates in an array
				},
			},
			{
				$project: {
					_id: 0,
					chartData: 1,
					TotalCount: 1,
					PercentageChange: {
						$cond: {
							if: { $eq: ['$LastDayOrderCount', 0] },
							then: 0,
							else: {
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$LastDayOrderCount',
													'$FirstDayOrderCount',
												],
											},
											'$FirstDayOrderCount',
										],
									},
									100,
								],
							},
						},
					},
				},
			},
		],
		axes: [
			{
				xAxis: ['date'],
				yAxis: ['order'],
			},
		],
	},
	{
		name: ACTIONS.INCREASE_TRANSACTIONS,
		condition: [
			{
				$match: {
					storeId: '',
					posCreatedAt: {
						$gte: '',
						$lte: '',
					},
				},
			},
			{
				$group: {
					_id: {
						year: { $year: '$posCreatedAt' },
						month: { $month: '$posCreatedAt' },
						day: { $dayOfMonth: '$posCreatedAt' },
					},
					totalFinalTotal: { $sum: '$totals.finalTotal' },
				},
			},
			{
				$project: {
					_id: 0,
					date: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: {
								$dateFromParts: {
									year: '$_id.year',
									month: '$_id.month',
									day: '$_id.day',
								},
							},
							timezone: '',
						},
					},
					totalFinalTotal: {
						$round: ['$totalFinalTotal', 2],
					},
				},
			},
			{
				$sort: { date: 1 },
			},
			{
				$group: {
					_id: null, // Group all documents into a single group
					TotalCount: { $sum: '$totalFinalTotal' }, // Calculate the total final total
					FirstDayFinalTotal: { $first: '$totalFinalTotal' }, // Get the final total of the first day
					LastDayFinalTotal: { $last: '$totalFinalTotal' }, // Get the final total of the last day
					chartData: {
						$push: {
							date: '$date',
							Transactions: '$totalFinalTotal',
						},
					}, // Store daily final totals with dates in an array
				},
			},
			{
				$project: {
					_id: 0,
					chartData: 1,
					TotalCount: 1,
					PercentageChange: {
						$cond: {
							if: { $eq: ['$LastDayFinalTotal', 0] },
							then: 0,
							else: {
								$multiply: [
									{
										$divide: [
											{
												$subtract: [
													'$LastDayFinalTotal',
													'$FirstDayFinalTotal',
												],
											},
											'$FirstDayFinalTotal',
										],
									},
									100,
								],
							},
						},
					},
				},
			},
		],
		axes: [
			{
				xAxis: ['date'],
				yAxis: ['Transactions'],
			},
		],
	},
];
