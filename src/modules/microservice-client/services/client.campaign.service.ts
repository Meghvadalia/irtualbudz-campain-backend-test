import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Campaign } from '../entities/campaign.entity';
import mongoose, { Model, Types } from 'mongoose';
import { CAMPAIGN_STATUS, ICampaign } from '../interfaces/campaign.interface';
import * as path from 'path';
import { pagination } from 'src/utils/pagination';
import { UsersService } from 'src/microservices/user/service/users.service';
import { ClientStoreService } from './client.store.service';
import { Goals } from 'src/model/goals/entities/goals.entity';
import { CampaignTypes } from 'src/model/campaignTypes/entities/campaignTypes.entity';
import { Channel } from 'src/model/channels/entities/channel.entity';
import { AudienceDetail } from '../entities/audienceDetails.entity';
import { Action } from 'src/model/actions/entities/actions.entity';
import { createDirectoryIfNotExists, uploadFiles } from 'src/utils/fileUpload';
import { KAFKA_CAMPAIGN_EVENT_TYPE, UPLOAD_DIRECTORY } from 'src/common/constants';
import { CampaignAsset } from 'src/model/campaignAssets/entities/campaignAsset.entity';
import { Product } from 'src/microservices/inventory';
import { Suggestions } from 'src/model/suggestions/entities/suggestions.entity';
import { ICampaignAsset, ICampaignAssetFiles } from 'src/model/campaignAssets/interface/campaignAsset.interface';
import * as fs from 'fs';
import { dynamicCatchException, throwNotFoundException } from 'src/utils/error.utils';
import { ClientAudienceCustomerService } from './client.audienceCustomer.service';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { CampaignProducer } from 'src/modules/kafka/producers/campaign.producer';

@Injectable()
export class ClientCampaignService {
	constructor(
		@InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
		@InjectModel(Goals.name) private readonly goalsModel: Model<Goals>,
		@InjectModel(CampaignTypes.name) private readonly campaignTypeModel: Model<CampaignTypes>,
		@InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
		@InjectModel(AudienceDetail.name) private readonly audienceModel: Model<AudienceDetail>,
		@InjectModel(Action.name) private readonly actionModel: Model<Action>,
		@InjectModel(CampaignAsset.name) private readonly campaignAssetModel: Model<CampaignAsset>,
		@InjectModel(Product.name) private readonly productModel: Model<Product>,
		@InjectModel(Suggestions.name) private readonly suggestionModel: Model<Suggestions>,
		private readonly userService: UsersService,
		private readonly storeService: ClientStoreService,
		private readonly audienceService: ClientAudienceCustomerService,
		private readonly campaignProducer: CampaignProducer
	) {}

	async addCampaign(data: Partial<ICampaign>, files) {
		const directory = path.join(process.cwd(), 'public', UPLOAD_DIRECTORY.CAMPAIGN);
		await createDirectoryIfNotExists(directory);

		const filePaths = await uploadFiles(files, directory);

		const campaignDataWithFiles = { ...data, files: filePaths };
		const campaign = await this.campaignModel.create(campaignDataWithFiles);
		setImmediate(() => {
			this.audienceService.addTargetAudience(data.audienceId, campaign._id as unknown as string, data.storeId.toString());
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
		return this.campaignModel.findByIdAndUpdate(campaignId, { $set: { campaignStatus: status } }, { new: true });
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

			if (campaignList.length === 0) throw new NotFoundException(`Campaign list not found`);

			const paginatedCampaignList = pagination(campaignList, page, limit);
			return paginatedCampaignList;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	private async populateCampaignData(storeId?: string, name?: string): Promise<any[]> {
		try {
			const populateOptions = [
				{ path: 'campaignType', select: 'name', model: this.campaignTypeModel },
				{ path: 'goals', select: 'name', model: this.goalsModel },
				{ path: 'actions', select: 'name', model: this.actionModel },
				{ path: 'audienceId', select: 'name', model: this.audienceModel },
				{ path: 'channels', select: 'name', model: this.channelModel },
				{ path: 'selectedSuggestion', select: 'name', model: this.suggestionModel },
			];

			let query = this.campaignModel.find({});
			const regex = new RegExp(name, 'i');
			if (storeId && name) {
				console.log('storeId and name');
				query = query.find({
					storeId: new mongoose.Types.ObjectId(storeId),
					campaignName: { $regex: regex },
				});
			} else if (!storeId && name) {
				query = query.find({
					campaignName: { $regex: regex },
				});
			} else if (!storeId) {
				query = query;
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
			const campaigns: ICampaign[] = await this.campaignModel.findOne({ _id: campaignId });
			return campaigns;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getCampaignDetail(campaignId) {
		try {
			const campaign = await this.campaignModel
				.findOne({ _id: campaignId })
				.populate([
					{ path: 'campaignType', select: 'name', model: this.campaignTypeModel },
					{ path: 'goals', select: 'name', model: this.goalsModel },
					{ path: 'audienceId', select: 'name', model: this.audienceModel },
					{ path: 'actions', select: 'name', model: this.actionModel },
					{ path: 'channels', select: 'name', model: this.channelModel },
					{ path: 'selectedSuggestion', select: 'name', model: this.suggestionModel },
				])
				.select(['-createdAt', '-updatedAt', '-__v']);

			const campaignAsset = await this.campaignAssetModel
				.find({ campaignId })
				.populate({ path: 'channelId', select: 'name', model: this.channelModel })
				.select(['-createdAt', '-__v', '-updatedAt', '-campaignId']);

			const fetchProductDetails = async (productId) => {
				try {
					const product = await this.productModel.findOne({ _id: productId }).select(['productName']);
					return product;
				} catch (error) {
					console.error(`Error fetching product details for ID ${productId}: ${error}`);
					return null;
				}
			};

			const populatedSortItems = await Promise.all(
				campaign.sortItem.map(async (item) => {
					if (mongoose.Types.ObjectId.isValid(item)) {
						const product = await fetchProductDetails(item);
						if (product) {
							return product.toObject();
						}
					}
					return item;
				})
			);

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

			let asset = await this.campaignAssetModel.findOne({ campaignId, channelId });
			if (asset) {
				asset.files = [...asset.files, ...assetFiles];
				await asset.save();
			} else {
				const campaignAssetWithFiles = {
					...data,
					files: assetFiles,
				};
				asset = await this.campaignAssetModel.create(campaignAssetWithFiles);
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

			const fileToDelete: ICampaignAssetFiles = asset.files?.find((file) => file._id.toString() === id);
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
				.populate({ path: 'campaignId', select: 'campaignName', model: this.campaignModel })
				.populate({ path: 'channelId', select: 'name', model: this.channelModel })
				.select(['-createdAt', '-updatedAt', '-__v']);

			return campaignAssets;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async removeCampaign(campaignId: Types.ObjectId) {
		try {
			const campaigns = await this.campaignModel.findByIdAndRemove({ _id: campaignId });
			return campaigns;
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
