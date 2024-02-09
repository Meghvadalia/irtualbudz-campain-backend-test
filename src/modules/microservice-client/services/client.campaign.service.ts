import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Campaign } from '../entities/campaign.entity';
import mongoose, { Model, PipelineStage, Types } from 'mongoose';
import { CAMPAIGN_STATUS, ICampaign, SORT_BY, SORT_KEYS } from '../interfaces/campaign.interface';
import * as path from 'path';
import { pagination } from 'src/utils/pagination';
import { UsersService } from 'src/microservices/user/service/users.service';
import { ClientStoreService } from './client.store.service';
import { Goals } from 'src/model/goals/entities/goals.entity';
import { Channel } from 'src/model/channels/entities/channel.entity';
import { AudienceDetail } from '../entities/audienceDetails.entity';
import { Action } from 'src/model/actions/entities/actions.entity';
import { createDirectoryIfNotExists, uploadFiles } from 'src/utils/fileUpload';
import {
	DATABASE_COLLECTION,
	KAFKA_CAMPAIGN_EVENT_TYPE,
	KAFKA_CUSTOMER_EVENT_TYPE,
	UPLOAD_DIRECTORY,
} from 'src/common/constants';
import { CampaignAsset } from 'src/model/campaignAssets/entities/campaignAsset.entity';
import { Product } from 'src/microservices/inventory';
import { Suggestions } from 'src/model/suggestions/entities/suggestions.entity';
import {
	ICampaignAsset,
	ICampaignAssetFiles,
} from 'src/model/campaignAssets/interface/campaignAsset.interface';
import * as fs from 'fs';
import { dynamicCatchException } from 'src/utils/error.utils';
import { ClientAudienceCustomerService } from './client.audienceCustomer.service';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { CampaignProducer } from 'src/modules/kafka/producers/campaign.producer';
import { ClientNotificationService } from './client.notification.service';
import { NotificationType } from 'src/model/notification/interface/notification.interface';
import axios, { AxiosRequestConfig } from 'axios';
import { RawTemplate } from 'src/model/rawTemplate/entities/rawTemplate.entity';
import { Template } from 'src/model/template/entities/template.entity';
import { formatDateRange, templateUpdateFun, uniqueKeys } from 'src/utils/templateUpdate';
import { Store } from 'src/model/store/entities/store.entity';
import { TemplateReplaceKey } from 'src/model/template/interfaces/template.interface';
import { CustomerProducer } from 'src/modules/kafka/producers/customer.producer';
import { Channels } from 'src/model/channels/interface/channel.interface';
import { Cart } from 'src/microservices/order/entities/cart.entity';
import { ClientCategoryService } from '../services/client.category.service';

@Injectable()
export class ClientCampaignService {
	constructor(
		@InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
		@InjectModel(Goals.name) private readonly goalsModel: Model<Goals>,
		@InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
		@InjectModel(AudienceDetail.name) private readonly audienceModel: Model<AudienceDetail>,
		@InjectModel(Action.name) private readonly actionModel: Model<Action>,
		@InjectModel(CampaignAsset.name) private readonly campaignAssetModel: Model<CampaignAsset>,
		@InjectModel(Product.name) private readonly productModel: Model<Product>,
		@InjectModel(Template.name) private readonly templateModel: Model<Template>,
		@InjectModel(Suggestions.name) private readonly suggestionModel: Model<Suggestions>,
		@InjectModel(RawTemplate.name) private readonly rawTemplate: Model<RawTemplate>,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
		private readonly userService: UsersService,
		private readonly storeService: ClientStoreService,
		private readonly audienceService: ClientAudienceCustomerService,
		private readonly campaignProducer: CampaignProducer,
		private readonly clientNotificationService: ClientNotificationService,
		private readonly customerProducer: CustomerProducer,
		private readonly clientCategoryService: ClientCategoryService
	) {}

	async addCampaign(data: Partial<ICampaign>, files, userId: string) {
		const directory = path.join(process.cwd(), 'public', UPLOAD_DIRECTORY.CAMPAIGN);
		let template;
		await createDirectoryIfNotExists(directory);

		const filePaths = await uploadFiles(files, directory);

		// @ts-ignore
		data.sortItem = JSON.parse(data.sortItem);
		if (data.sortItem && Array.isArray(data.sortItem)) {
			data.sortItem.forEach((sortItem) => {
				if (sortItem.suggestionId) {
					sortItem.suggestionId = new Types.ObjectId(sortItem.suggestionId);
				}

				if (sortItem.sortBy && Array.isArray(sortItem.sortBy)) {
					sortItem.sortBy.forEach((sortBy) => {
						if (sortBy.key === SORT_KEYS.AllSellable) {
							sortBy.value = sortBy.value.map((value) => new Types.ObjectId(value));
						}
					});
				}
			});
		}

		const campaignDataWithFiles = { ...data, files: filePaths };

		let productItemCount = 0;
		let productList = [];
		for (let index = 0; index < campaignDataWithFiles.sortItem.length; index++) {
			const itemCount: SORT_BY[] = campaignDataWithFiles.sortItem[index].sortBy;
			for (let i = 0; i < itemCount.length; i++) {
				const element = itemCount[i];
				if (element.key == SORT_KEYS.AllSellable) {
					productItemCount = productItemCount + element.value.length;
					const itemList = await this.productModel.find({
						_id: {
							$in: element.value.map((x) => new mongoose.Types.ObjectId(x)),
						},
					});
					productList = [...productList, ...itemList];
				}
				if (element.key == SORT_KEYS.Brand && element.value.length > 0) {
					productItemCount = productItemCount + element.value.length;
					const storeData = await this.storeModel.findById(campaignDataWithFiles.storeId);
					const pipeline: PipelineStage[] = [
						{
							$match: {
								storeId: new mongoose.Types.ObjectId(campaignDataWithFiles.storeId),
								title2: { $in: element.value },
							},
						},
						{
							$group: {
								_id: '$productName',
								sku: { $first: '$sku' },
								totalQuantitySold: { $sum: '$quantity' },
							},
						},
						{
							$sort: { totalQuantitySold: -1 },
						},
						{
							$limit: element.value.length,
						},
						{
							$lookup: {
								from: DATABASE_COLLECTION.PRODUCT,
								let: { sku: '$sku' }, // Use the local variable 'sku'
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{ $eq: ['$sku', '$$sku'] },
													{ $eq: ['$companyId', storeData.companyId] }, // Additional condition for companyId
												],
												// Compare the 'sku' field from both collections
											},
											// Add additional conditions as needed
										},
									},
								],
								as: 'productDetails',
							},
						},
						{
							$unwind: '$productDetails',
						},
						{
							$project: {
								productName: '$productDetails.productName',
								_id: '$productDetails._id',
								sku: '$productDetails.sku',
								productPictureURL: '$productDetails.productPictureURL',
								totalQuantitySold: 1,
								category: '$productDetails.category',
							},
						},
					];
					const result = await this.cartModel.aggregate(pipeline);
					if (result.length > 0) {
						productList = [...productList, ...result];
					} else {
						productList.push('');
					}
				}
				if (element.key == SORT_KEYS.Category) {
					productItemCount = productItemCount + element.value.length;
					const categoryData: any = await this.clientCategoryService.getMatchingCategories(
						// @ts-ignore
						element.value
					);
					console.log('categoryData =>' + JSON.stringify(categoryData));
					for (let i = 0; i < element.value.length; i++) {
						const data = categoryData[i];
						if (data) {
							productList.push({
								productName: data.name,
								productPictureURL: (
									process.env.REACT_APP_IMAGE_SERVER +
									data.images[Math.floor(Math.random() * data.images.length)]
								).trim(),
								type: 'category',
							});
						} else {
							productList.push({
								productName: element.value[i],
								productPictureURL: '',
								type: 'category',
							});
						}
					}
					// productList = [...productList, ...element.value];
				}

				const categoryData: any = await this.clientCategoryService.getMatchingCategories(
					// @ts-ignore
					productList.map((x) => x.category)
				);
				for (let i = 0; i < productList.length; i++) {
					const element = productList[i];
					if (element.productPictureURL == null && element.type != 'category') {
						if (categoryData.length > 0) {
							let imgs = categoryData.filter((x) => x.name == element.category)[0].images;
							element.productPictureURL = (
								process.env.REACT_APP_IMAGE_SERVER + imgs[Math.floor(Math.random() * imgs.length)]
							).trim();
						}
					}
				}
			}
		}
		console.log('productList ' + productList.length);
		console.log(productList);
		console.log('productItemCount ' + productItemCount);
		var templateList = await this.rawTemplate.find({
			itemCount: productItemCount,
			isActive: true,
		});
		if (templateList.length == 0) {
			templateList = await this.rawTemplate.aggregate([
				{
					$group: {
						_id: null,
						maxItemCount: { $max: '$itemCount' },
					},
				},
				{
					$lookup: {
						from: DATABASE_COLLECTION.RAW_TEMPLATE,
						let: { maxCount: '$maxItemCount' },
						pipeline: [
							{
								$match: {
									$expr: { $eq: ['$itemCount', '$$maxCount'] },
								},
							},
							{ $sort: { itemCount: -1 } },
						],
						as: 'documentsWithMaxItemCount',
					},
				},
				{
					$unwind: '$documentsWithMaxItemCount',
				},
				{
					$replaceRoot: { newRoot: '$documentsWithMaxItemCount' },
				},
			]);
		}
		const campaign = await this.campaignModel.create(campaignDataWithFiles);

		for (const channel of data.channels) {
			const channelData = await this.channelModel.findById(channel);
			const storeData = await this.storeModel.findById(campaignDataWithFiles.storeId);

			if (channelData.name === Channels.Email) {
				const options: AxiosRequestConfig = {
					method: 'post',
					url: `${process.env.TRACKING_SERVER}/list/add`,
					data: JSON.stringify({
						app: storeData.brandId,
						userID: 1,
						name: campaign.campaignName,
						opt_in: '0',
					}),
					headers: {
						'Content-Type': 'application/json',
						Authorization:
							'Basic ' +
							btoa(
								`${process.env.TRACKING_AUTH_USERNAME}:${process.env.TRACKING_AUTH_PASSWORD}`
							).toString(),
					},
				};
				try {
					axios
						.request(options)
						.then(async (response) => {
							await this.campaignModel.findOneAndUpdate(
								{ _id: campaign._id },
								{ listId: response.data.data.listId }
							);
							setTimeout(() => {
								this.customerProducer.sendCustomerMessage(
									campaign._id as unknown as string,
									response.data.data.listId,
									KAFKA_CUSTOMER_EVENT_TYPE.CUSTOMER_TOPIC
								);
							}, 1000);
						})
						.catch((error) => {
							console.log(error);
						});
				} catch (error) {
					console.log(error);
				}
				console.log(templateList.length + ' row Templates found');
				for (let temp = 0; temp < templateList.length; temp++) {
					const templateElement = templateList[temp];
					template = templateElement.content;
					const replaceKeys = templateElement.replacements;
					template = template.replaceAll(
						'src="./public/',
						`src="${process.env.REACT_APP_IMAGE_SERVER}/public/template/`
					);
					template = template.replaceAll(TemplateReplaceKey.STORE_LINK, storeData.storeLink);
					template = template.replaceAll(TemplateReplaceKey.STORE_LOGO, storeData.logos);
					template = template.replaceAll(
						TemplateReplaceKey.CAMPAIGN_NAME,
						campaignDataWithFiles.campaignName
					);
					template = template.replaceAll(
						TemplateReplaceKey.STORE_FB_LINK,
						storeData.facebook ? storeData.facebook : storeData.storeLink
					);
					template = template.replaceAll(
						TemplateReplaceKey.STORE_TWITTER_LINK,
						storeData.twitter ? storeData.twitter : storeData.storeLink
					);
					template = template.replaceAll(
						TemplateReplaceKey.STORE_LINKEDIN_LINK,
						storeData.linkedIn ? storeData.linkedIn : storeData.storeLink
					);
					template = template.replaceAll(
						TemplateReplaceKey.STORE_INSTA_LINK,
						storeData.instagram ? storeData.instagram : storeData.storeLink
					);
					template = template.replaceAll(
						TemplateReplaceKey.STORE_WEB_LINK,
						storeData.website ? storeData.website : storeData.storeLink
					);
					template = template.replaceAll(
						TemplateReplaceKey.STORE_ADDRESS,
						storeData.store_address ? storeData.store_address : ''
					);
					const replaceArray = [];
					const replaceSpecialCharacters = (text) => {
						if (text) {
							text = text.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_');
						}
						return text;
					};
					const replaceMap = {
						[TemplateReplaceKey.ITEM_IMAGE]: (element) => element?.productPictureURL || '',
						[TemplateReplaceKey.PRODUCT_NAME]: (element) =>
							replaceSpecialCharacters(element.productName) || '',
						[TemplateReplaceKey.PRODUCT_DISCOUNT]: () => `${campaignDataWithFiles.discount}%` || '',
						[TemplateReplaceKey.PRODUCT_DESC]: (element) =>
							replaceSpecialCharacters(element?.productDescription) || '',
						// [TemplateReplaceKey.STORE_LINK]: () => storeData.storeLink || '',
						// [TemplateReplaceKey.CAMPAIGN_NAME]: () => campaignDataWithFiles.campaignName || '',
						// [TemplateReplaceKey.STORE_LOGO]: () => storeData.logos,
						[TemplateReplaceKey.CAMPAIGN_DATE]: () =>
							formatDateRange(
								campaignDataWithFiles.startDateWithTime,
								campaignDataWithFiles.endDateWithTime
							) || '',
						[TemplateReplaceKey.STORE_DESC]: () => storeData.storeDesc || '',
						[TemplateReplaceKey.CAMPAIGN_IMAGE]: () =>
							(campaign?.files.length > 0
								? (process.env.REACT_APP_IMAGE_SERVER + campaign?.files[0]).trim()
								: null) || '',
						// [TemplateReplaceKey.STORE_FB_LINK]: () => storeData.facebook || '',
						// [TemplateReplaceKey.STORE_TWITTER_LINK]: () => storeData.twitter || '',
						// [TemplateReplaceKey.STORE_LINKEDIN_LINK]: () => storeData.linkedin || '',
						// [TemplateReplaceKey.STORE_INSTA_LINK]: () => storeData.instagram || '',
						// [TemplateReplaceKey.STORE_WEB_LINK]: () => storeData.website || '',
					};
					for (const element of productList) {
						for (const obj of replaceKeys) {
							const valueGenerator = replaceMap[obj];
							if (valueGenerator) {
								const searchKey = obj;
								var value = valueGenerator(element);

								if (element.type == 'category') {
									if (searchKey == TemplateReplaceKey.ITEM_IMAGE) {
										const categoryData = element.productName;
										replaceArray.push({ searchKey, value, categoryData });
									} else if (searchKey == TemplateReplaceKey.PRODUCT_DESC) {
										value = value.replace(/\n/g, '');
										replaceArray.push({ searchKey, value });
									} else {
										replaceArray.push({ searchKey, value });
									}
								} else {
									if (searchKey == TemplateReplaceKey.PRODUCT_DESC) {
										value = value.replace(/\n/g, '');
										replaceArray.push({ searchKey, value });
									} else {
										replaceArray.push({ searchKey, value });
									}
								}
							}
						}
					}
					console.log('replaceArray');
					console.log(replaceArray);
					const newTemplate = templateUpdateFun(template, replaceArray);

					const templateData = await this.templateModel.create({
						campaignId: campaign._id,
						rawTemplateId: templateElement._id,
						template: newTemplate,
						// .replace(/\n/g, '').replace(/\t/g, ''),
						// .replace(/\\"/g, "'"),
						userId: new Types.ObjectId(userId),
					});
					console.log('Template created ' + templateData?._id);
				}
			}
		}

		setImmediate(() => {
			const audienceIds = Array.isArray(data.audienceId) ? data.audienceId : [data.audienceId];
			for (const audienceId of audienceIds) {
				this.audienceService.addTargetAudience(
					audienceId,
					campaign._id as unknown as string,
					data.storeId.toString()
				);
			}
		});

		const currentDate = new Date();
		if (campaign.startDateWithTime > currentDate) {
			this.campaignProducer.sendCampaignMessage(
				campaign._id as unknown as string,
				campaign.startDateWithTime,
				campaign.endDateWithTime,
				KAFKA_CAMPAIGN_EVENT_TYPE.EVENT_STARTED
			);
		}
		setTimeout(() => {
			this.campaignProducer.sendCampaignMessage(
				campaign._id as unknown as string,
				campaign.startDateWithTime,
				campaign.endDateWithTime,
				KAFKA_CAMPAIGN_EVENT_TYPE.EVENT_ENDED
			);
		}, 1000);

		return campaign;
	}

	async updateStatusToInProgress(campaignId: string) {
		return this.updateCampaignStatus(campaignId, CAMPAIGN_STATUS.IN_PROGRESS);
	}

	async updateStatusToClosed(campaignId: string) {
		return this.updateCampaignStatus(campaignId, CAMPAIGN_STATUS.CLOSED);
	}

	private async updateCampaignStatus(campaignId: string, status: string) {
		return this.campaignModel.findByIdAndUpdate(
			campaignId,
			{ $set: { campaignStatus: status } },
			{ new: true }
		);
	}

	async sendMail(campaignData) {
		// const templateData = await this.templateModel.findOneAndUpdate({_id:campaignData.templateId},{template:campaignData.template});
		// const templateData = await this.templateModel.findById(campaignData.templateId);
		// console.log(templateData);

		const campaignTempData = await this.campaignModel.findById(campaignData.campaignId);

		const storeData = await this.storeModel.findById(campaignTempData.storeId);
		const obj = {
			from_name: storeData.locationName,
			from_email: storeData.email ? storeData.email : process.env.SENDY_FROM_EMAIL,
			title: campaignTempData.campaignName,
			subject: campaignTempData.campaignName,
			plain_text: 'text',
			html_text: campaignData.template,
			schedule_date_time: campaignData.startDate,
			schedule_timezone: storeData.timeZone ? storeData.timeZone : 'UTC',
			brand_id: storeData.brandId,
			send_campaign: 0,
			list_ids: campaignTempData.listId,
		};

		const options = {
			method: 'post',
			url: `${process.env.TRACKING_SERVER}/campaign/create`,
			data: JSON.stringify(obj),
			headers: {
				'Content-Type': 'application/json',
				Authorization:
					'Basic ' +
					btoa(
						`${process.env.TRACKING_AUTH_USERNAME}:${process.env.TRACKING_AUTH_PASSWORD}`
					).toString(),
			},
		};
		const createCampaign = axios
			.request(options)
			.then((data) => {
				return data.data;
			})
			.catch((error) => {
				console.log(error);
			});

		return createCampaign;
	}

	async campaignList(user, page: number, limit: number, storeId?: string, name?: string) {
		try {
			let campaignList: any[] = [];

			const userData = await this.userService.findById(user.userId);

			if (user.type === USER_TYPE.SUPER_ADMIN || user.type === USER_TYPE.ADMIN) {
				if (!storeId) {
					campaignList = await this.populateCampaignData(null, name);
				}
				campaignList = await this.populateCampaignData(storeId, name);
			} else if (user.type === USER_TYPE.COMPANY_ADMIN) {
				if (storeId) {
					campaignList = await this.populateCampaignData(storeId, name);
				} else {
					const storeList = await this.storeService.storeListByCompanyId(userData.companyId);
					for (const store of storeList) {
						const campaignsForStore = await this.populateCampaignData(store._id, name);
						campaignList.push(...campaignsForStore);
					}
				}
			} else if (user.type === USER_TYPE.STORE_ADMIN || user.type === USER_TYPE.MANAGER) {
				campaignList = await this.populateCampaignData(userData.storeId, name);
			}

			if (campaignList.length === 0) throw new NotFoundException('Campaign list not found');

			for (const campaign of campaignList) {
				const populatedSortItems = [];

				for (const item of campaign.sortItem) {
					const suggestion = await this.suggestionModel
						.findById(item.suggestionId)
						.select(['name']);
					const sortByArray = [];

					for (const sort of item.sortBy) {
						if (sort.key === SORT_KEYS.AllSellable) {
							const productDetails = await Promise.all(
								sort.value.map((productRef) => this.fetchProductDetails(productRef.toString()))
							);
							sortByArray.push({
								key: sort.key,
								value: productDetails,
							});
						} else {
							sortByArray.push({
								key: sort.key,
								value: sort.value,
							});
						}
					}

					populatedSortItems.push({
						suggestion,
						sortBy: sortByArray,
					});
					campaign.sortItem = populatedSortItems;
				}
			}

			const paginatedCampaignList = pagination(campaignList, page, limit);
			return paginatedCampaignList;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	private async populateCampaignData(storeId?: string, name?: string): Promise<any[]> {
		try {
			const populateOptions = [
				{ path: 'goals', select: 'name', model: this.goalsModel },
				{ path: 'actions', select: 'name', model: this.actionModel },
				{ path: 'audienceId', select: 'name', model: this.audienceModel },
				{ path: 'channels', select: 'name', model: this.channelModel },
				// { path: 'campaignType', select: 'name', model: this.campaignTypeModel },
				// { path: 'suggestionId', select: 'name', model: this.suggestionModel },
			];

			let query = this.campaignModel.find({});
			const regex = new RegExp(name, 'i');
			if (storeId && name) {
				query = query.find({
					storeId: new mongoose.Types.ObjectId(storeId),
					campaignName: { $regex: regex },
				});
			} else if (!storeId && name) {
				query = query.find({
					campaignName: { $regex: regex },
				});
			} else if (!storeId) {
				query;
			} else {
				query = query.find({ storeId: new mongoose.Types.ObjectId(storeId) });
			}
			query = query.sort({ createdAt: -1 });
			return query.populate(populateOptions).select(['-createdAt', '-updatedAt', '-__v']);
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getCampaign(campaignId: Types.ObjectId) {
		try {
			const campaigns: ICampaign[] = await this.campaignModel.findOne({
				_id: campaignId,
			});
			return campaigns;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async fetchProductDetails(productId) {
		try {
			const product = await this.productModel.findOne({ _id: productId }).select(['productName']);
			return product;
		} catch (error) {
			console.error(`Error fetching product details for ID ${productId}: ${error}`);
			return null;
		}
	}

	async updateCampaign(campaignId, data) {
		try {
			const campaign = await this.campaignModel.findOneAndUpdate(
				{ _id: new Types.ObjectId(campaignId) },
				{ $set: { ...data } }
			);
			return campaign;
		} catch (error) {
			console.error(`Error updating campaign details for ID ${campaignId}: ${error}`);
			return null;
		}
	}

	async getCampaignDetail(campaignId) {
		try {
			const campaign = await this.campaignModel
				.findOne({ _id: campaignId })
				.populate([
					{ path: 'goals', select: 'name', model: this.goalsModel },
					{ path: 'audienceId', select: 'name', model: this.audienceModel },
					{ path: 'actions', select: 'name', model: this.actionModel },
					{ path: 'channels', select: 'name', model: this.channelModel },
					// { path: 'campaignType', select: 'name', model: this.campaignTypeModel },
					// { path: 'selectedSuggestion', select: 'name', model: this.suggestionModel },
				])
				.select(['-createdAt', '-updatedAt', '-__v']);

			const campaignAsset = await this.campaignAssetModel
				.find({ campaignId })
				.populate({
					path: 'channelId',
					select: 'name',
					model: this.channelModel,
				})
				.select(['-createdAt', '-__v', '-updatedAt', '-campaignId']);

			const populatedSortItems = [];

			for (const item of campaign.sortItem) {
				const suggestion = await this.suggestionModel.findById(item.suggestionId).select(['name']);
				const sortByArray = [];

				for (const sort of item.sortBy) {
					if (sort.key === SORT_KEYS.AllSellable) {
						const productDetails = await Promise.all(
							sort.value.map((productRef) => this.fetchProductDetails(productRef.toString()))
						);
						sortByArray.push({
							key: sort.key,
							value: productDetails,
						});
					} else {
						sortByArray.push({
							key: sort.key,
							value: sort.value,
						});
					}
				}

				populatedSortItems.push({
					suggestion,
					sortBy: sortByArray,
				});
			}

			const combinedData = {
				campaign: {
					...campaign.toObject(),
					asset: campaignAsset,
					sortItem: populatedSortItems,
				},
			};
			return combinedData;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async uploadCampaignAsset(data, files: Express.Multer.File[]) {
		try {
			const campaignId = new mongoose.Types.ObjectId(data.campaignId);
			const channelId = new mongoose.Types.ObjectId(data.channelId);

			const directory = path.join(process.cwd(), 'public', UPLOAD_DIRECTORY.ASSETS);

			await createDirectoryIfNotExists(directory);
			const filePaths = await uploadFiles(files, directory);

			const assetFiles = filePaths.map((filePath) => ({
				filePath,
				isActive: true,
			}));

			let asset = await this.campaignAssetModel.findOne({
				campaignId,
				channelId,
			});
			if (asset) {
				asset.files = [...asset.files, ...assetFiles];
				await asset.save();
				const campaignData = await this.campaignModel.findById(campaignId);
				await this.clientNotificationService.createSingleNotificationForStore(
					campaignData.storeId,
					`New asset uploaded in ${campaignData.campaignName} campaign`,
					`New asset in ${campaignData.campaignName}`,
					{ campaignId: campaignData._id },
					NotificationType.NewAsset
				);
			} else {
				const campaignAssetWithFiles = {
					...data,
					files: assetFiles,
				};
				asset = await this.campaignAssetModel.create(campaignAssetWithFiles);
				const campaignData = await this.campaignModel.findById(campaignId);
				await this.clientNotificationService.createSingleNotificationForStore(
					campaignData.storeId,
					`New asset uploaded in ${campaignData.campaignName} campaign`,
					`New asset in ${campaignData.campaignName}`,
					{ campaignId: campaignData._id },
					NotificationType.NewAsset
				);
			}

			return asset;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async removeFile(id: string) {
		try {
			const asset: ICampaignAsset = await this.campaignAssetModel.findOne({
				files: {
					$elemMatch: {
						_id: new mongoose.Types.ObjectId(id),
					},
				},
			});

			if (!asset) throw new Error('File not found');

			const fileToDelete: ICampaignAssetFiles = asset.files?.find(
				(file) => file._id.toString() === id
			);
			if (fileToDelete) {
				const filePath = fileToDelete.filePath;
				const updatedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

				fs.unlinkSync(updatedFilePath);
			}

			const updatedAsset = await this.campaignAssetModel.findOneAndUpdate(
				{
					files: {
						$elemMatch: {
							_id: new mongoose.Types.ObjectId(id),
						},
					},
				},
				{
					$pull: {
						files: {
							_id: new mongoose.Types.ObjectId(id),
						},
					},
				},
				{
					new: true,
				}
			);
			return updatedAsset;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getAssets(id: string) {
		try {
			const campaignAssets = await this.campaignAssetModel
				.find({ campaignId: new mongoose.Types.ObjectId(id) })
				.populate({
					path: 'campaignId',
					select: 'campaignName',
					model: this.campaignModel,
				})
				.populate({
					path: 'channelId',
					select: 'name',
					model: this.channelModel,
				})
				.select(['-createdAt', '-updatedAt', '-__v']);

			return campaignAssets;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async removeCampaign(campaignId: Types.ObjectId) {
		try {
			const campaigns = await this.campaignModel.findByIdAndRemove(
				{
					_id: campaignId,
				},
				{ lean: true }
			);
			return campaigns;
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
