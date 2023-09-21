import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { Order } from '../../../microservices/order/entities/order.entity';
import { ClientGoalService } from './client.goal.service';
import { ClientGraphService } from './client.graph.service';
import { ClientActionService } from './client.action.service';
import { ClientCampaignService } from './client.campaign.service';
import { ClientStoreService } from './client.store.service';
import { from } from 'rxjs';
import * as moment from 'moment-timezone';
import { updatePipeline } from 'src/utils/pipelineUpdator';
import { sortBy } from '../interfaces/campaign.interface';
import { Campaign } from '../entities/campaign.entity';
import { Action } from 'src/model/actions/entities/actions.entity';
import { ACTIONS } from 'src/common/seeders/actions';
import { AudienceCustomer } from '../entities/audienceCustomers.entity';
import { AudienceDetail } from '../entities/audienceDetails.entity';
import { RedisService } from 'src/config/cache/config.service';
import { IReplacements } from 'src/common/interface';
import { AudienceName, DAYS_OF_WEEK } from 'src/common/constants';
import { dynamicCatchException } from 'src/utils/error.utils';
import { Cart } from 'src/microservices/order/entities/cart.entity';


@Injectable()
export class ClientOrderService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		public clientGoalService: ClientGoalService,
		public clientGraphService: ClientGraphService,
		public clientActionService: ClientActionService,
		public clientCampaignService: ClientCampaignService,
		public clientStoreService: ClientStoreService,
		private readonly redisService: RedisService,
		@InjectModel(AudienceDetail.name) private audienceDetailsModel: Model<AudienceDetail>,
		@InjectModel(AudienceCustomer.name) private audienceCustomerModel: Model<AudienceCustomer>,
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
	) { }

	async getOrderForEachDate(storeId: Types.ObjectId, fromDate: Date, toDate: Date, goalFlag?: any, campaignId?: any, audienceTracking?: any) {
		try {
			const fromStartDate = new Date(fromDate);
			const fromEndDate = new Date(toDate);
			// let goalId;
			// let actionId ;
			var storeData = await this.clientStoreService.storeById(
				storeId.toString()
			);
			let goalPipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: fromEndDate,
						},
					},
				},
				{
					$group: {
						_id: {
							$dateToString: {
								format: "%Y-%m-%d",
								date: "$posCreatedAt",
								timezone: storeData.timeZone
							}
						},
						date: {
							$first: {
								$dateToString: {
									format: "%Y-%m-%d",
									date: "$posCreatedAt",
									timezone: storeData.timeZone
								},
							}
						},
						count: {
							$sum: 1
						},
						totalAmount: {
							$sum: "$totals.finalTotal"
						}
					}
				},
				{
					$sort: {
						date: 1
					}
				},
				{
					$project: {
						_id: 0,
						date: 1,
						count: 1,
						totalAmount: {
							$round: ["$totalAmount", 2]
						}
					}
				},
				{
					$group: {
						_id: null,  // Group all documents into a single group
						TotalOrderCount: { $sum: '$count' },  // Calculate the total count
						TotalCount: { $sum: '$totalAmount' },  // Calculate the total amount
						FirstDayCount: { $first: '$count' },  // Get the count of the first day
						LastDayCount: { $last: '$count' },  // Get the count of the last day
						FirstDayAmount: { $first: '$totalAmount' },  // Get the amount of the first day
						LastDayAmount: { $last: '$totalAmount' },  // Get the amount of the last day
						chartData: { $push: { date: '$date', count: '$count', totalAmount: '$totalAmount' } },  // Store daily counts and amounts with dates in an array
					},
				},
				{
					$project: {
						_id: 0,
						chartData: 1,
						TotalOrderCount: 1,
						TotalCount: 1,
						PercentageChangeCount: {
							'$cond': {
								if: { '$eq': ['$LastDayCount', 0] }, 
								then: 0, 
								else: {
									$multiply: [
										{ $divide: [{ $subtract: ['$LastDayCount', '$FirstDayCount'] }, '$FirstDayCount'] },
										100
									]
								}
							}
						},
						PercentageChange: {
							'$cond': {
								if: { '$eq': ['$LastDayAmount', 0] }, 
								then: 0, 
								else: {
									$multiply: [
										{ $divide: [{ $subtract: ['$LastDayAmount', '$FirstDayAmount'] }, '$FirstDayAmount'] },
										100
									]
								}
							}
						},
					},
				},
			];
			let campaignData
			let redisUniqueId = "";
			goalFlag = goalFlag == 'true' ? true : false
			audienceTracking = audienceTracking == 'true' ? true : false
			if (campaignId) {
				campaignData = await this.clientCampaignService.getCampaign(campaignId)
				redisUniqueId = campaignId

				var campaingFilterItem = campaignData?.sortItem
				var sortType = campaignData?.sortBy
				
				if (campaignData.goals) {
					redisUniqueId = (redisUniqueId + "-" + campaignData.goals).toString();
				}

				if (campaignData.actions) {
					redisUniqueId = (redisUniqueId + "-" + campaignData.actions).toString();
				}

				if (audienceTracking) {
					redisUniqueId = (redisUniqueId + "-" + campaignData?.audienceId).toString();
				}
			} else {
				redisUniqueId = (fromStartDate + "-" + fromEndDate).toString();
			}

			

			let actionPipeline: PipelineStage[]
			var goalAxes;
			var actionAxes;
			let goalDBData;
			let actionDBData;
			let audienceDBData;
			let ids

			// const cachedStoreData: any = JSON.parse(await this.redisService.getValue(redisUniqueId));
			// if (cachedStoreData) {				
			// 	console.log("Graph data come from cachedStoreData")
			// 	return cachedStoreData;
			// } else {
				console.log("Create query for graph data")
				if (campaignData && campaignData != null) {
					if (campaignData?.audienceId) {

						let audienceName = await this.audienceDetailsModel.findOne({ _id: campaignData?.audienceId })
						let customerIds
						if(audienceName?.name == AudienceName.ALL){
							customerIds = await this.audienceCustomerModel.find({
								storeId: storeId
							}, { customerId: true, _id: false })
						}else{
							customerIds = await this.audienceCustomerModel.find({
								audienceId: campaignData?.audienceId,
								storeId: storeId
							}, { customerId: true, _id: false })
						}
						

						ids = customerIds.length > 0 ? customerIds.map(x => x.customerId) : []
						
						audienceDBData = {
							name: audienceName?.name,
							count: ids.length
						}
						console.log("audienceDBData =>", audienceDBData)
					}
					if (campaignData?.goals != null && campaignData?.goals != undefined && campaignData?.goals != '') {
						goalDBData = await this.clientGoalService.goalsById(campaignData?.goals)
						let goalGraphId = goalDBData.graphId
						let graphData = await this.clientGraphService.graphById(goalGraphId)
						goalAxes = graphData.axes;
						goalPipeline = graphData.condition

						if (audienceTracking && campaignData?.audienceId && goalFlag) {
							goalPipeline[0]['$match'] = { ...goalPipeline[0]['$match'], ...{ customerId: { $in: ids } } }
						}

						let replacementsGoal = [
							{ key: 'storeId', 'value': storeId },
							{ key: '$gte', 'value': fromStartDate },
							{ key: '$lte', 'value': fromEndDate },
							{ key: 'timezone', 'value': storeData.timeZone }
						]
						for (let i = 0; i < replacementsGoal.length; i++) {
							const element = replacementsGoal[i];
							updatePipeline(goalPipeline, element.key, element.value);
						}
						let newStages
						if(campaignData?.schedulesDays.length > 0 ){
							let weekendDays = [];
							for (let i = 0; i < campaignData?.schedulesDays.length; i++) {
								weekendDays.push(DAYS_OF_WEEK[campaignData?.schedulesDays[i]]);
							}
							newStages = [
								{
								  $addFields: {
									dayOfWeek: { $dayOfWeek: { date: '$posCreatedAt', timezone: storeData.timeZone } }
								  }
								},
								{
								  $match: {
									dayOfWeek: { $in: weekendDays } // Filter for Saturday (6) and Sunday (7)
								  }
								}
							  ];
							goalPipeline.splice(1, 0, ...newStages);
						}

						if (campaignData.actions) {
							actionDBData = await this.clientActionService.getActionById(campaignData.actions)
							if(actionDBData?.graphId && actionDBData.graphId != null && actionDBData.graphId != ''){
								
								let actionGraphId = actionDBData.graphId.toString()
								let graphActionData = await this.clientGraphService.graphById(actionGraphId)
								actionAxes = graphActionData.axes;

								actionPipeline = graphActionData.condition
								if (audienceTracking && campaignData?.audienceId && !goalFlag) {
									actionPipeline[0]['$match'] = { ...actionPipeline[0]['$match'], ...{ customerId: { $in: ids } } }
								}
								let replacements: IReplacements[] = [
									{ key: 'storeId', 'value': storeId },
									{ key: '$gte', 'value': fromStartDate },
									{ key: '$lte', 'value': fromEndDate },
									{ key: 'timezone', 'value': storeData.timeZone }
								]
								if (campaingFilterItem) {
									if (sortType == sortBy.AllSellable) {
										replacements = [...replacements, ...[{ key: '$or', 'value': [{ "itemsInCart": { "$in": campaingFilterItem } }] }]]
									} else if (sortType == sortBy.Brand) {
										if(actionDBData.name == ACTIONS.REDUCE_INVENTORY){
											let tempIds = await this.cartModel.find({title2:{$in:campaingFilterItem}}).select({_id:1})											
											let productIds = tempIds.map((x=>x._id))
											replacements = [...replacements, ...[{ key: '$or', 'value': [{ "itemsInCart": { "$in": productIds } }] }]]
										}else{
											console.log("in brand")
											replacements = [...replacements, ...[{ key: 'product.brand', 'value': { "$in": campaingFilterItem } }]]
										}
									} else if(sortType == sortBy.Category){
										if(actionDBData.name == ACTIONS.REDUCE_INVENTORY){
											let tempIds = await this.cartModel.find({category:{$in:campaingFilterItem}}).select({_id:1})
											let productIds = tempIds.map((x=>x._id))
											replacements = [...replacements, ...[{ key: '$or', 'value': [{ "itemsInCart": { "$in": productIds } }] }]]
										}
									}
								}
								for (let i = 0; i < replacements.length; i++) {
									const element = replacements[i];
									updatePipeline(actionPipeline, element.key, element.value);
								}
								if(newStages) actionPipeline.splice(1,0, ...newStages);

							}
						}
					} else {
						console.log("Default Graph")
					}
					
				} else {
					// Error("Campaign data not available")
					console.log("Campaign data not available, default graph")
				}
			// }

			// console.log("redisUniqueId Value ====>", redisUniqueId)
			console.log("goalPipeline")
			console.log(JSON.stringify(goalPipeline))
			console.time("<============== query goal pipeline ===============>")
			let goalData = await this.orderModel.aggregate(goalPipeline);
			console.timeEnd("<============== query goal pipeline ===============>")
			
			let actionData
			if (actionPipeline) {
				console.log("actionPipeline")
				console.log(JSON.stringify(actionPipeline))
				console.time("<============== query action pipeline ===============>")
				actionData = await this.orderModel.aggregate(actionPipeline);
				console.timeEnd("<============== query action pipeline ===============>")
			}

			let responseData = {
				goalGraphData: {
					axes: goalAxes,
					data: goalData ? goalData[0]?.chartData : [],
					PercentageChange: goalData ? goalData[0]?.PercentageChange : [],
					TotalCount: goalData ? goalData[0]?.TotalCount : [],
					name: goalDBData?.name
				},
				actionGraphData: {
					axes: actionAxes,
					data: actionData ? actionData[0]?.chartData : [],
					PercentageChange: actionData ? actionData[0]?.PercentageChange : [],
					TotalCount: actionData ? actionData[0]?.TotalCount : [],
					name: actionDBData?.name
				},
				audianceData: audienceDBData
			}

			// await this.redisService.setValue(redisUniqueId, responseData);

			return responseData;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error)
		}
	}


	async getBrandWiseSales(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
						},
					},
				},
				{
					$unwind: {
						path: '$itemsInCart',
					},
				},
				{
					$lookup: {
						from: 'cart',
						localField: 'itemsInCart',
						foreignField: '_id',
						as: 'product',
					},
				},
				{
					$unwind: {
						path: '$product',
					},
				},
				{
					$group: {
						_id: {
							brand: '$product.title2',
						},
						totalAmount: {
							$sum: '$totals.finalTotal',
						},
					},
				},
				{
					$sort: {
						totalAmount: -1,
					},
				},
				{
					$limit: 5,
				},
				{
					$project: {
						_id: 0,
						brand: '$_id.brand',
						totalAmount: 1,
					},
				},
			];
	
			let brandWiseOrderData = await this.orderModel.aggregate(pipeline);
	
			return brandWiseOrderData;
		} catch (error) {
			dynamicCatchException(error)
		}
		
	}

	async getEmployeeWiseSales(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
						},
					},
				},
				{
					$group: {
						_id: '$staffId',
						totalSales: { $sum: '$totals.finalTotal' },
					},
				},
				{
					$sort: { totalSales: -1 },
				},
				{
					$limit: 5,
				},
				{
					$lookup: {
						from: 'staff',
						localField: '_id',
						foreignField: '_id',
						as: 'employee',
					},
				},
				{
					$unwind: '$employee',
				},
				{
					$lookup: {
						from: 'orders',
						let: { staffId: '$employee._id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$staffId', '$$staffId'] },
											{
												$gte: [
													'$posCreatedAt',
													new Date(
														new Date().setDate(
															new Date().getDate() -
															28
														)
													),
												],
											},
											{
												$lte: [
													'$posCreatedAt',
													new Date(
														new Date().setDate(
															new Date().getDate() -
															14
														)
													),
												],
											},
										],
									},
								},
							},
							{
								$group: {
									_id: '$staffId',
									previousSales: {
										$sum: '$totals.finalTotal',
									},
								},
							},
						],
						as: 'previousSalesData',
					},
				},
				{
					$unwind: {
						path: '$previousSalesData',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$project: {
						staffId: '$_id',
						staffName: '$employee.staffName',
						totalSales: 1,
						previousSales: {
							$ifNull: ['$previousSalesData.previousSales', 0],
						},
					},
				},
				{
					$addFields: {
						growthPercentage: {
							$cond: [
								{ $eq: ['$previousSales', 0] },
								0,
								{
									$multiply: [
										{
											$divide: [
												{
													$subtract: [
														'$totalSales',
														'$previousSales',
													],
												},
												'$previousSales',
											],
										},
										100,
									],
								},
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						staffId: 1,
						staffName: 1,
						totalAmount: '$totalSales',
						growthPercentage: { $round: ['$growthPercentage', 2] },
					},
				},
			];

			let staffWiseOrderData = await this.orderModel.aggregate(pipeline);

			return staffWiseOrderData;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error)
		}
	}

	async getAverageSpendAndLoyaltyPointsForAllCustomer(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		const startDateStartTime = fromDate;
		const storeData = await this.clientStoreService.storeById(
			storeId.toString()
		);
		const endDateEndTime = toDate;

		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: startDateStartTime,
							$lte: endDateEndTime,
						},
					},
				},
				{
					$addFields: {
						posCreatedAtLocal: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$posCreatedAt',
								timezone: storeData.timeZone,
							},
						},
					},
				},
				{
					$group: {
						_id: '$customerId',
						averageSpend: { $avg: '$totals.finalTotal' },
						totalPoints: { $sum: '$currentPoints' },
						fromDateAverageSpend: {
							$avg: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: startDateStartTime,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.finalTotal',
									0,
								],
							},
						},
						toDateAverageSpend: {
							$avg: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: endDateEndTime,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.finalTotal',
									0,
								],
							},
						},
						fromDateTotalLoyaltyPointsConverted: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: startDateStartTime,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$currentPoints',
									0,
								],
							},
						},
						toDateTotalLoyaltyPointsConverted: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: endDateEndTime,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$currentPoints',
									0,
								],
							},
						},
					},
				},
				{
					$group: {
						_id: null,
						averageSpend: { $avg: '$averageSpend' },
						totalPointsConverted: { $sum: '$totalPoints' },
						fromDateAverageSpend: { $avg: '$fromDateAverageSpend' },
						toDateAverageSpend: { $avg: '$toDateAverageSpend' },
						fromDateTotalLoyaltyPointsConverted: {
							$sum: '$fromDateTotalLoyaltyPointsConverted',
						},
						toDateTotalLoyaltyPointsConverted: {
							$sum: '$toDateTotalLoyaltyPointsConverted',
						},
					},
				},
				{
					$project: {
						_id: 0,
						averageSpend: {
							$round: [{ $ifNull: ['$averageSpend', 0] }, 2],
						},
						loyaltyPointsConverted: '$totalPointsConverted',
						averageSpendGrowth: {
							$round: [
								{
									$cond: [
										{ $ne: ['$fromDateAverageSpend', 0] },
										{
											$multiply: [
												{
													$divide: [
														{
															$subtract: [
																'$toDateAverageSpend',
																'$fromDateAverageSpend',
															],
														},
														{
															$ifNull: [
																'$fromDateAverageSpend',
																1,
															],
														},
													],
												},
												100,
											],
										},
										0,
									],
								},
								2,
							],
						},
						loyaltyPointsConversionGrowth: {
							$round: [
								{
									$cond: [
										{
											$and: [
												{
													$ne: [
														'$toDateTotalLoyaltyPointsConverted',
														0,
													],
												},
												{
													$ne: [
														'$fromDateTotalLoyaltyPointsConverted',
														0,
													],
												},
											],
										},
										{
											$multiply: [
												{
													$divide: [
														{
															$subtract: [
																'$toDateTotalLoyaltyPointsConverted',
																'$fromDateTotalLoyaltyPointsConverted',
															],
														},
														{
															$ifNull: [
																'$fromDateTotalLoyaltyPointsConverted',
																1,
															],
														},
													],
												},
												100,
											],
										},
										0,
									],
								},
								2,
							],
						},
					},
				},
			];

			const result = await this.orderModel.aggregate(pipeline);

			const averageSpendWithLoyalty =
				result.length > 0
					? result[0]
					: {
						averageSpend: 0,
						loyaltyPointsConverted: 0,
						averageSpendGrowth: 0,
						loyaltyPointsConversionGrowth: 0,
					};

			return averageSpendWithLoyalty;
		} catch (error) {
			console.error(error);
			return {
				averageSpend: 0,
				loyaltyPointsConverted: 0,
				averageSpendGrowth: 0,
				loyaltyPointsConversionGrowth: 0,
			};
		}
	}

	async getTopCategory(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		const fromStartDate = fromDate;
		const toEndDate = toDate;
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
						},
					},
				},
				{
					$unwind: '$itemsInCart',
				},
				{
					$lookup: {
						from: 'cart',
						localField: 'itemsInCart',
						foreignField: '_id',
						as: 'category',
					},
				},
				{
					$unwind: '$category',
				},
				{
					$group: {
						_id: '$category.category',
						totalAmount: { $sum: '$totals.finalTotal' },
					},
				},
				{
					$sort: {
						totalAmount: -1,
					},
				},
				{
					$limit: 1,
				},
				{
					$project: {
						_id: 0,
						topCategory: '$_id',
						totalAmount: 1,
					},
				},
			];

			const result = await this.orderModel.aggregate(pipeline);
			const { totalAmount, topCategory } =
				result.length > 0
					? result[0]
					: { totalAmount: 0, topCategory: '' };
			return topCategory;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error)
		}
	}

	async getRecurringAndNewCustomerPercentage(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		const fromStartDate = fromDate;
		const fromEndDate = toDate;
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: fromEndDate,
						},
					},
				},
				{
					$group: {
						_id: '$customerId',
						orderCount: { $sum: 1 },
					},
				},
				{
					$group: {
						_id: null,
						recurringCustomers: {
							$sum: {
								$cond: [{ $gt: ['$orderCount', 1] }, 1, 0],
							},
						},
						newCustomers: {
							$sum: {
								$cond: [{ $eq: ['$orderCount', 1] }, 1, 0],
							},
						},
						totalCustomers: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						returningCustomer: {
							$round: [
								{
									'$cond': {
										if: { '$eq': ['$recurringCustomers', 0] }, 
										then: 0, 
										else: {
											$multiply: [
												{
													$divide: [
														'$recurringCustomers',
														'$totalCustomers',
													],
												},
												100,
											],
										}
									}
								},
								2,
							],
						},
						newCustomer: {
							$round: [
								{
									'$cond': {
										if: { '$eq': ['$newCustomers', 0] }, 
										then: 0, 
										else: {
											$multiply: [
												{
													$divide: [
														'$newCustomers',
														'$totalCustomers',
													],
												},
												100,
											],
										}
									}
								},
								2,
							],
						},
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			const { returningCustomer, newCustomer } =
				result.length > 0
					? result[0]
					: { returningCustomer: 0, newCustomer: 0 };
			return { returningCustomer: returningCustomer, newCustomer };
		} catch (error) {
			console.error('Error While Calculating the percentage'+ error);
			dynamicCatchException(error)
		}
	}

	async totalOverViewCountForOrdersBetweenDate(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		try {
			let storeData = await this.clientStoreService.storeById(
				storeId.toString()
			);
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
						},
					},
				},
				{
					$addFields: {
						posCreatedAtLocal: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$posCreatedAt',
								timezone: storeData.timeZone,
							},
						},
					},
				},
				{
					$group: {
						_id: null,
						totalOrderAmount: { $sum: '$totals.finalTotal' },
						totalDiscounts: {
							$sum: { $round: ['$totals.totalDiscounts', 2] },
						},
						totalOrders: { $sum: 1 },
						fromDateTotalAmount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: fromDate,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.finalTotal',
									0,
								],
							},
						},
						toDateTotalAmount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: toDate,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.finalTotal',
									0,
								],
							},
						},
						fromDateTotalDiscount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: fromDate,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.totalDiscounts',
									0,
								],
							},
						},
						toDateTotalDiscount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: toDate,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.totalDiscounts',
									0,
								],
							},
						},
						fromDateOrderCount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: fromDate,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									1,
									0,
								],
							},
						},
						toDateOrderCount: {
							$sum: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: toDate,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									1,
									0,
								],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						totalOrderAmount: 1,
						totalDiscounts: { $round: ['$totalDiscounts', 2] },
						totalOrders: 1,
						orderAmountGrowth: {
							$round: [
								{
									'$cond': {
										if: { '$eq': ['$toDateTotalAmount', 0] }, 
										then: 0, 
										else: {
											$multiply: [
												{
													$divide: [
														{
															$subtract: [
																'$toDateTotalAmount',
																'$fromDateTotalAmount',
															],
														},
														{
															$cond: [
																{
																	$eq: [
																		'$fromDateTotalAmount',
																		0,
																	],
																},
																1,
																'$fromDateTotalAmount',
															],
														},
													],
												},
												100,
											],
										}
									}
								},
								2,
							],
						},
						discountGrowth: {
							$round: [
								{
									'$cond': {
										if: { '$eq': ['$toDateTotalDiscount', 0] }, 
										then: 0, 
										else: {
											$multiply: [
												{
													$divide: [
														{
															$subtract: [
																'$toDateTotalDiscount',
																'$fromDateTotalDiscount',
															],
														},
														{
															$cond: [
																{
																	$eq: [
																		'$fromDateTotalDiscount',
																		0,
																	],
																},
																1,
																'$fromDateTotalDiscount',
															],
														},
													],
												},
												100,
											],
										}
									}
								},
								2,
							],
						},
						orderCountGrowth: {
							$round: [
								{
									'$cond': {
										if: { '$eq': ['$toDateOrderCount', 0] }, 
										then: 0, 
										else: {
											$multiply: [
												{
													$divide: [
														{
															$subtract: [
																'$toDateOrderCount',
																'$fromDateOrderCount',
															],
														},
														{
															$cond: [
																{
																	$eq: [
																		'$fromDateOrderCount',
																		0,
																	],
																},
																1,
																'$fromDateOrderCount',
															],
														},
													],
												},
												100,
											],
										}
									}
								},
								2,
							],
						},
					},
				},
			];

			const result = await this.orderModel.aggregate(pipeline);
			const {
				totalOrderAmount,
				totalDiscounts,
				totalOrders,
				orderAmountGrowth,
				discountGrowth,
				orderCountGrowth,
			} =
				result.length > 0
					? result[0]
					: {
						totalOrderAmount: 0,
						totalDiscounts: 0,
						totalOrders: 0,
						orderAmountGrowth: 0,
						discountGrowth: 0,
						orderCountGrowth: 0,
					};
			return {
				totalOrderAmount,
				totalDiscounts,
				totalOrders,
				orderAmountGrowth,
				discountGrowth,
				orderCountGrowth,
			};
		} catch (error) {
			console.error('Error While Fetching Overview Section'+ error);
			dynamicCatchException(error)
		}
	}

	async getHourWiseDateForSpecificDateRange(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		let storeData = await this.clientStoreService.storeById(
			storeId.toString()
		);
		try {
			const fromStartDate = fromDate;
			const toEndDate = toDate;
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
						},
					},
				},
				{
					$group: {
						_id: {
							hour: {
								$hour: {
									date: '$posCreatedAt',
									timezone: storeData.timeZone,
								},
							},
							isAM: {
								$lt: [
									{
										$hour: {
											date: '$posCreatedAt',
											timezone: storeData.timeZone,
										},
									},
									12,
								],
							},
						},
						count: { $sum: 1 },
					},
				},
				{
					$sort: { '_id.hour': 1 },
				},
				{
					$project: {
						_id: 0,
						hour: {
							$concat: [
								{
									$cond: {
										if: { $eq: ['$_id.isAM', true] },
										then: {
											$concat: [
												{ $toString: '$_id.hour' },
												' AM',
											],
										},
										else: {
											$concat: [
												{
													$toString: {
														$subtract: [
															'$_id.hour',
															12,
														],
													},
												},
												' PM',
											],
										},
									},
								},
							],
						},
						count: 1,
						convertedDate: 1,
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			let hourlyData = result.length > 0 ? result : [];
			return hourlyData;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error)
		}
	}

	async getWeeklyBusiestDataForSpecificRange(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		try {
			const fromStartDate = fromDate;
			const toEndDate = toDate;
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromStartDate,
							$lte: toEndDate,
						},
					},
				},
				{
					$group: {
						_id: { $dayOfWeek: '$posCreatedAt' },
						count: { $sum: 1 },
					},
				},
				{
					$sort: { _id: 1 },
				},
				{
					$project: {
						_id: 0,
						dayOfWeek: {
							$switch: {
								branches: [
									{
										case: { $eq: ['$_id', 1] },
										then: 'Sunday',
									},
									{
										case: { $eq: ['$_id', 2] },
										then: 'Monday',
									},
									{
										case: { $eq: ['$_id', 3] },
										then: 'Tuesday',
									},
									{
										case: { $eq: ['$_id', 4] },
										then: 'Wednesday',
									},
									{
										case: { $eq: ['$_id', 5] },
										then: 'Thursday',
									},
									{
										case: { $eq: ['$_id', 6] },
										then: 'Friday',
									},
									{
										case: { $eq: ['$_id', 7] },
										then: 'Saturday',
									},
								],
								default: 'Unknown',
							},
						},
						count: 1,
					},
				},
			];
			const result = await this.orderModel.aggregate(pipeline);

			let weekData = result.length > 0 ? result : [];
			return weekData;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error)
		}
	}

	async topDiscountedCoupon(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
						},
					},
				},
				{
					$facet: {
						totalOrders: [
							{
								$group: {
									_id: null,
									count: { $sum: 1 },
								},
							},
						],
						promoCodeCounts: [
							{
								$unwind: '$itemsInCart',
							},
							{
								$lookup: {
									from: 'cart',
									localField: 'itemsInCart',
									foreignField: '_id',
									as: 'carts',
								},
							},
							{
								$unwind: '$carts',
							},
							{
								$unwind: '$carts.itemDiscounts',
							},
							{
								$group: {
									_id: '$carts.itemDiscounts.name',
									count: { $sum: 1 },
								},
							},
							{
								$sort: {
									count: -1,
								},
							},
							{
								$limit: 3,
							},
							{
								$project: {
									_id: 0,
									promoName: '$_id',
									count: 1,
								},
							},
						],
					},
				},
				{
					$unwind: '$promoCodeCounts',
				},
				{
					$project: {
						promoName: '$promoCodeCounts.promoName',
						percentage: {
							'$cond': {
								if: { '$eq': ['$promoCodeCounts.count', 0] }, 
								then: 0, 
								else: {
									$multiply: [
										{
											$divide: [
												'$promoCodeCounts.count',
												{
													$arrayElemAt: [
														'$totalOrders.count',
														0,
													],
												},
											],
										},
										100,
									],
								}
							}
						},
					},
				},
				{
					$project: {
						promoName: 1,
						percentage: { $round: ['$percentage', 2] },
					},
				},
			];

			const result = await this.orderModel.aggregate(pipeline);
			return result;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error)
		}
	}
	// Top Discounted Items
	async topDiscountedItem(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		try {
			const pipeline: PipelineStage[] = [
				{
					$match: {
						storeId,
						posCreatedAt: {
							$gte: fromDate,
							$lte: toDate,
						},
					},
				},
				{
					$unwind: "$itemsInCart"
				},
				{
					$lookup: {
						from: "cart",
						localField: "itemsInCart",
						foreignField: "_id",
						as: "cartItem"
					}
				},
				{
					$unwind: "$cartItem"
				},
				{
					$unwind: "$cartItem.itemDiscounts"
				},
				{
					$group: {
						_id: "$cartItem.sku",
						productName: { $first: "$cartItem.productName" },
						totalDiscountAmount: { $sum: { $divide: ["$cartItem.itemDiscounts.penniesOff", 100] } },
						totalSales: { $sum: 1 },
						totalProductDiscounts: { $sum: "$totals.totalDiscounts" }
					}
				},
				{
					$match: {
						totalDiscountAmount: { $gt: 0 }
					}
				},
				{
					$project: {
						_id: 0,
						sku: "$_id",
						productName: 1,
						totalDiscountAmount: 1,
						totalSales: 1,
						totalProductDiscounts: 1,
						percentage: {
							'$cond': {
								if: { '$eq': ['$totalProductDiscounts', 0] }, 
								then: 0, 
								else: {
									$round: [{
										$multiply: [{ $divide: ["$totalDiscountAmount", "$totalProductDiscounts"] }, 100]
									}, 2]
								}
							}
						}
					}
				},
				{
					$limit: 3,
				},
				{
					$sort: {
						percentage: -1
					}
				}
			];

			const result = await this.orderModel.aggregate(pipeline);
			return result;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error)
		}
	}

	async averageCartSize(
		storeId: Types.ObjectId,
		fromDate: Date,
		toDate: Date
	) {
		try {
			const startDateStartTime = fromDate;
			const endDateEndTime = toDate;
			const storeData = await this.clientStoreService.storeById(
				storeId.toString()
			);
			const pipeline = [
				{
					$match: {
						storeId: new Types.ObjectId(storeId),
						posCreatedAt: {
							$gte: startDateStartTime,
							$lte: endDateEndTime,
						},
					},
				},
				{
					$addFields: {
						posCreatedAtLocal: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$posCreatedAt',
								timezone: storeData.timeZone,
							},
						},
					},
				},
				{
					$group: {
						_id: null,
						averageCartSize: { $avg: '$totals.subTotal' },
						firstDaySubTotal: {
							$avg: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: startDateStartTime,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.subTotal',
									0,
								],
							},
						},
						lastDaySubTotal: {
							$avg: {
								$cond: [
									{
										$eq: [
											'$posCreatedAtLocal',
											{
												$dateToString: {
													format: '%Y-%m-%d',
													date: endDateEndTime,
													timezone:
														storeData.timeZone,
												},
											},
										],
									},
									'$totals.subTotal',
									0,
								],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						cartSizeGrowth: {
							'$cond': {
								if: { '$eq': ['$firstDaySubTotal', 0] }, 
								then: 0,
								else: {
									$round: [
										{
											$multiply: [
												{
													$divide: [
														{
															$subtract: [
																'$lastDaySubTotal',
																'$firstDaySubTotal',
															],
														},
														{ $abs: '$firstDaySubTotal' },
													],
												},
												100,
											],
										},
										2,
									],
								}
							}
						},
						averageCartSize: { $round: ['$averageCartSize', 2] },
					},
				},
			];

			const result = await this.orderModel.aggregate(pipeline);
			const { averageCartSize, cartSizeGrowth } =
				result.length > 0
					? result[0]
					: { averageCartSize: null, cartSizeGrowth: null };
			return { averageCartSize, cartSizeGrowth };
		} catch (error) {
			console.error(error)
			dynamicCatchException(error)
		}
	}
}
