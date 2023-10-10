import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage, Types } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { Inventory } from 'src/microservices/inventory/entities/inventory.entity';
import { Order } from 'src/microservices/order/entities/order.entity';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { User } from 'src/microservices/user/entities/user.entity';
import { Notification } from 'src/model/notification/entities/notification.entity';
import { INOTIFICATION, NotificationType } from 'src/model/notification/interface/notification.interface';
import { Store } from 'src/model/store/entities/store.entity';
import { dynamicCatchException } from 'src/utils/error.utils';
import { paginateWithNextHit } from 'src/utils/pagination';
import { sendSuccess } from 'src/utils/request-response.utils';

@Injectable()
export class ClientNotificationService {
	constructor(
		@InjectModel(Notification.name) private readonly notificationModel: Model<INOTIFICATION>,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(User.name) private userModel: Model<User>,
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Inventory.name) private readonly inventoryModel: Model<Inventory>
	) { }

	async listAllNotification(user: { userId: Types.ObjectId; type: string }, page: number, limit: number) {
		try {
			let query = {};
			let storeList = [];
			let userData = await this.userModel.findById(user.userId);
			if (user.type != USER_TYPE.COMPANY_ADMIN && user.type != USER_TYPE.SUPER_ADMIN && user.type != USER_TYPE.ADMIN) {
				query = { storeId: userData.storeId, userId: new mongoose.Types.ObjectId(user.userId) };
			} else {
				storeList = await this.storeModel.find({ companyId: userData.companyId }).select({ _id: true });
				storeList = storeList.map((x: Types.ObjectId) => x._id);
				query = { storeId: { $in: storeList }, userId: new mongoose.Types.ObjectId(user.userId) };
			}
			let pipeline: PipelineStage[] = [
				{
					$match: query,
				},
				{
					$lookup: {
						from: DATABASE_COLLECTION.STORES,
						let: { storeId: '$storeId' },
						pipeline: [
							{
								$match: {
									$expr: { $eq: ['$_id', '$$storeId'] },
								},
							},
							{
								$project: {
									_id: 0,
									locationName: 1,
								},
							},
						],
						as: 'storeData',
					},
				},
				{
					$unwind: '$storeData',
				},
				{
					$sort: {
						_id: -1,
					},
				},
			];
			return await paginateWithNextHit(this.notificationModel, pipeline, limit, page);
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getNotificationArrayList() {
		try {
			let storeList = await this.storeModel.find({ isActive: true, isDeleted: false });
			let arrayFunc = [];
			for (let i = 0; i < storeList.length; i++) {
				arrayFunc.push(this.getStoreAndCompanyWiseUsers(storeList[i]));
			}
			const data = await Promise.all(arrayFunc);

			let mergedArray = [].concat(...data);
			return mergedArray;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	getStoreAndCompanyWiseUsers(store, message = '', title = '', data = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				let expireProductsAggregate = [
					{
						$match: {
							storeId: store._id,
							expirationDate: {
								$gte: new Date(),
								$lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
							},
						},
					},
					{
						$count: 'total',
					},
				];

				let slowMovingItemsAggregate = [
					{
						$match: {
							storeId: store._id,
							orderStatus: 'sold',
							posCreatedAt: {
								$gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
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
							as: 'cartData',
						},
					},
					{
						$unwind: {
							path: '$cartData',
						},
					},
					{
						$group: {
							_id: '$cartData.sku',
							count: {
								$sum: 1,
							},
						},
					},
					{
						$match: {
							count: {
								$gte: 1,
								$lte: 5,
							},
						},
					},
					{
						$count: 'total',
					},
				];
				const [expireProducts, slowMovingItems] = await Promise.all([
					this.inventoryModel.aggregate(expireProductsAggregate),
					this.orderModel.aggregate(slowMovingItemsAggregate),
				]);

				const notifications = [];

				const userList = await this.userModel.find({
					$or: [
						{ storeId: new mongoose.Types.ObjectId(store._id) },
						{
							storeId: { $in: ['', null] },
							companyId: new mongoose.Types.ObjectId(store.companyId),
						},
					],
				});

				if (expireProducts.length > 0 && expireProducts[0]?.total > 0) {
					notifications.push(
						...userList.map((user) => ({
							userId: user._id,
							storeId: store._id,
							message: message != '' ? message : `You have a new message for ${expireProducts[0].total} product(s) expiring in 1 month`,
							title: title != '' ? title : 'Expiring products',
							isDeleted: false,
							isRead: false,
							notificationData:data,
							notificationType:NotificationType.Expiring
						}))
					);
				}

				if (slowMovingItems.length > 0 && slowMovingItems[0]?.total > 0) {
					notifications.push(
						...userList.map((user) => ({
							userId: user._id,
							storeId: store._id,
							message: message != '' ? message : `You have a new message for ${slowMovingItems[0].total} items that are moving slowly`,
							title: title != '' ? title : 'Slow Moving Items',
							isDeleted: false,
							isRead: false,
							notificationData:data,
							notificationType:NotificationType.SlowMoving
						}))
					);
				}

				notifications.push(
					...userList.map((user) => ({
						userId: user._id,
						storeId: store._id,
						message: 'Create the campaign for halloween',
						title: 'Halloween is coming',
						isDeleted: false,
						isRead: false,
						notificationData:{},
						notificationType:NotificationType.Halloween
					}))
				);

				resolve(notifications);
			} catch (error) {
				dynamicCatchException(error);
			}
		});
	}

	async insertStoreWiseNotification(notificationArray: INOTIFICATION[]) {
		try {
			let notification = await this.notificationModel.insertMany(notificationArray);
			return `${notification.length} notifications added`;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async createSingleNotificationForStore(storeId: Types.ObjectId, message = '', title = '',data = {}, type) {
		let storeData = await this.storeModel.findById(storeId)
		await this.getStoreAndCompanyWiseUsers(storeData, message, title, data)
			.then(async (notificationList: any) => {
				return sendSuccess(await this.insertStoreWiseNotification(notificationList));
			})
			.catch((error) => {
				console.error(error)
			})
	}


	async migrationScriptForNotification() {
		try {
			let NotificationList = await this.notificationModel.find({ notificationType: { $exists: false } });
			console.log("Notification")
			console.log(NotificationList.length)
			for (let i = 0; i < NotificationList.length; i++) {
				const element = NotificationList[i];
				if(element.title == "Halloween is coming"){
					element.notificationType = NotificationType.Halloween
				}
				if(element.title == NotificationType.SlowMoving){
					element.notificationType = NotificationType.SlowMoving
				}
				if(element.title == NotificationType.Expiring){
					element.notificationType = NotificationType.Expiring
				}
				if(element.title == NotificationType.NewAsset){
					element.notificationType = NotificationType.NewAsset
				}
				let id = element._id
				delete element._id
				await this.notificationModel.findByIdAndUpdate(id,element)
			}

		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
