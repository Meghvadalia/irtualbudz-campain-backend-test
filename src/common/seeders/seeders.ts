import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { posData } from './pos';
import { companyData } from './company';
import { User } from 'src/microservices/user/entities/user.entity';
import { superAdmin, userArrayForCompany } from './user';
import { ICompany } from 'src/model/company/interface/company.interface';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import axios, { AxiosRequestConfig } from 'axios';
import { Store } from 'src/model/store/entities/store.entity';
import { ClientStoreService } from 'src/modules/microservice-client/services/client.store.service';
import { goalsData } from './goals';
import { Goals } from 'src/model/goals/entities/goals.entity';
import { audienceDetails } from './audienceDetails';
import { AudienceDetail } from 'src/modules/microservice-client/entities/audienceDetails.entity';
import { Channel } from 'src/model/channels/entities/channel.entity';
import { Channels, IChannel } from 'src/model/channels/interface/channel.interface';
import { CAMPAIGN_TYPES } from './campaignTypes';
import { CampaignTypes } from 'src/model/campaignTypes/entities/campaignTypes.entity';
import { actionsList } from './actions';
import { Action } from 'src/model/actions/entities/actions.entity';
import { SuggestionList } from './suggestions';
import { Suggestions } from 'src/model/suggestions/entities/suggestions.entity';
import { graphData } from './graph';
import { Graph } from 'src/model/graph/entities/graph.entity';

@Injectable()
export class SeederService {
	constructor(
		@InjectModel(POS.name) private posModel: Model<POS>,
		@InjectModel(Company.name) private companyModel: Model<Company>,
		@InjectModel(User.name) private userModel: Model<User>,
		@InjectModel(Store.name) private storeModel: Model<Store>,
		@InjectModel(AudienceDetail.name) private audienceDetailModel: Model<AudienceDetail>,
		@InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
		@InjectModel(Goals.name) private goalsModel: Model<Goals>,
		@InjectModel(CampaignTypes.name) private campaignTypesModel: Model<CampaignTypes>,
		@InjectModel(Action.name) private actionsModel: Model<Action>,
		@InjectModel(Suggestions.name) private suggestionModel: Model<Suggestions>,
		@InjectModel(Graph.name) private graphModel: Model<Graph>,
		private readonly storeService: ClientStoreService
	) {
		setTimeout(() => {
			this.seedCollections();
		}, 300);
	}

	async seedPOS() {
		try {
			const bulkOps = posData.map((pos) => ({
				updateOne: {
					filter: { name: pos.name },
					update: {
						$set: {
							name: pos.name,
							liveUrl: pos.liveUrl ?? pos.liveUrl,
							stagingUrl: pos.stagingUrl,
							documentationUrl: pos.documentationUrl,
						},
					},
					upsert: true,
				},
			}));
			await this.posModel.bulkWrite(bulkOps);
			console.log('POS seeding Done');
		} catch (error) {
			console.error('Error Seeding POS collection:', error);
		}
	}

	async seedCompany() {
		try {
			for (const company of companyData) {
				const matchingPOS = await this.posModel.findOne({
					name: company.posName,
				});

				await this.companyModel.findOneAndUpdate(
					{
						name: company.name,
					},
					{
						name: company.name,
						posId: matchingPOS?._id,
						totalStore: company.totalStore,
						dataObject: company.dataObject,
						isActive: company.isActive,
						lastSyncDataDuration: company.lastSyncDataDuration,
					},
					{ upsert: true }
				);
			}

			console.log('Company seeding Done');
		} catch (error) {
			console.error('Error seeding Company collection:', error);
		}
	}

	async seedUser() {
		try {
			const userExists = await this.userModel.findOne({
				email: superAdmin.email,
			});

			if (!userExists) {
				await this.userModel.create({ ...superAdmin });
			}
			for (let index = 0; index < userArrayForCompany.length; index++) {
				const element = userArrayForCompany[index];
				const checkUserExist = await this.userModel.findOne({
					email: element.email,
				});
				const matchingCompany = await this.companyModel.findOne({
					name: element.companyName,
				});
				if (!checkUserExist) {
					await this.userModel.create({
						name: element.name,
						email: element.email,
						password: element.password,
						type: element.type,
						companyId: matchingCompany._id,
						phone: element.phone,
					});
				}
			}
		} catch (error) {
			console.error('Error seeding User collection:', error);
		}
	}

	async seedDutchieStores(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne<IPOS>({
				name: posName,
			});

			const companyData = await this.companyModel.find<ICompany>({
				posId: posData._id,
				isActive: true,
			});

			for (const company of companyData) {
				const tokenOptions = {
					method: 'get',
					url: `${posData.liveUrl}/util/AuthorizationHeader/${company.dataObject.key}`,
					headers: {
						Accept: 'application/json',
					},
				};

				const { data: token } = await axios.request(tokenOptions);

				const storeOptions: AxiosRequestConfig = {
					url: `${posData.liveUrl}/whoami`,
					headers: {
						Accept: 'application/json',
						Authorization: token,
					},
				};

				const { data } = await axios.request(storeOptions);

				const store = await this.storeModel.findOne({
					'location.locationId': data.locationId,
				});
				if (!store) {
					await this.storeModel.create({
						location: {
							locationId: data.locationId,
							locationName: data.locationName,
						},
						companyId: company._id,
					});
				}
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async graphCollection() {
		try {
			const bulkOps = graphData.map((graph) => ({
				updateOne: {
					filter: { name: graph.name },
					update: {
						$set: {
							name: graph.name,
							condition: graph.condition,
							axes: graph.axes,
						},
					},
					upsert: true,
				},
			}));
			// @ts-ignore
			await this.graphModel.bulkWrite(bulkOps);

			console.log('Graph seeding Done');
		} catch (error) {
			console.error('Error Seeding graph collection:', error);
		}
	}

	async seedGoals() {
		try {
			for (const goal of goalsData) {
				let graphId: any = await this.graphModel.findOne({
					name: goal.name,
				});

				await this.goalsModel.findOneAndUpdate(
					{
						name: goal.name,
					},
					{
						name: goal.name,
						isDeleted: goal.isDeleted,
						isActive: goal.isActive,
						graphId: graphId ? graphId._id : null,
					},
					{ upsert: true }
				);
			}

			console.log('Goals seeding Done');
		} catch (error) {
			console.error('Error seeding Goals collection:', error);
		}
	}

	async addAudienceDetails() {
		try {
			const bulkOps = audienceDetails.map((audienceDetail) => ({
				updateOne: {
					filter: { name: audienceDetail.name },
					update: {
						$set: {
							name: audienceDetail.name,
							audienceDescription: audienceDetail.audienceDescription,
							type: audienceDetail.type,
						},
					},
					upsert: true,
				},
			}));
			await this.audienceDetailModel.bulkWrite(bulkOps);

			console.log('Audience details seeded!!');
		} catch (error) {
			console.error('Error Seeding audience details:', error);
		}
	}

	async seedChannels() {
		try {
			const channelNames = Object.values(Channels);

			for (const channelName of channelNames) {
				const channelExists = await this.channelModel.findOne<IChannel>({ name: channelName });

				if (!channelExists) {
					await this.channelModel.create({ name: channelName });
				} else {
					console.log(`Channel "${channelName}" already exists. Skipping...`);
				}
			}

			console.log('Channels seeded successfully.');
		} catch (error) {
			console.error('Error seeding channels:', error);
		}
	}

	async seedCampaignTypes() {
		try {
			const bulkOps = CAMPAIGN_TYPES.map((campaignType) => ({
				updateOne: {
					filter: { name: campaignType.name },
					update: {
						$set: {
							name: campaignType.name,
						},
					},
					upsert: true,
				},
			}));
			await this.campaignTypesModel.bulkWrite(bulkOps);
		} catch (error) {
			console.error('Error seeding the campaign Type', error.message);
		}
	}

	async seedActions() {
		try {
			const bulkOperations = [];

			for (const action of actionsList) {
				let graphId = await this.graphModel.findOne({
					name: action.name,
				});
				let existingAction = await this.actionsModel.findOne({ name: action.name });
				const update = {
					name: action.name,
					isActive: action.isActive,
					isDeleted: action.isDeleted,
					isTrackable: action.isTrackable,
					graphId: graphId?._id ? graphId._id : null,
				};

				if (existingAction) {
					if (existingAction.graphId !== action.graphId) {
						update.graphId = action.graphId;
					}
				} else {
					update.graphId = action.graphId;
				}
				const filter = {
					name: action.name,
				};

				const upsertDocument = {
					updateOne: {
						filter,
						update,
						upsert: true,
					},
				};

				bulkOperations.push(upsertDocument);
			}

			const result = await this.actionsModel.bulkWrite(bulkOperations);
			console.log('Bulk write result:', result);
		} catch (error) {
			console.error('Error seeding the actions: ', error);
		}
	}

	async seedSuggestions() {
		try {
			const bulkOperations = SuggestionList.map((suggestion) => ({
				updateOne: {
					filter: { name: suggestion.name },
					update: {
						$set: {
							name: suggestion.name,
							condition: suggestion.condition,
							isActive: suggestion.isActive,
							isDeleted: suggestion.isDeleted,
							dateOffset: suggestion.dateOffset,
							collectionName: suggestion.collectionName,
							display: suggestion.display,
						},
					},
					upsert: true,
				},
			}));

			await this.suggestionModel.bulkWrite(bulkOperations);
		} catch (error) {
			console.error('Error seeding the suggestions: ', error.message);
		}
	}

	async seedCollections() {
		try {
			await this.seedPOS();
			await this.seedCompany();
			await this.seedChannels();
			await this.storeService.seedStoreData('flowhub');
			await this.seedUser();
			await this.graphCollection();
			await this.seedGoals();
			await this.seedCampaignTypes();
			await this.seedActions();
			await this.seedSuggestions();
			await this.addAudienceDetails();
			console.log('Seeding completed successfully');
		} catch (error) {
			console.error('Error seeding collections:', error);
		}
	}
}
