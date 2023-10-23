import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Store } from 'src/model/store/entities/store.entity';
import { IStore } from 'src/model/store/interface/store.inteface';
import axios from 'axios';
import { IStoreResponseFlowHub } from 'src/common/interface';
import { User } from 'src/microservices/user/entities/user.entity';
import { IUser } from 'src/microservices/user/interfaces/user.interface';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { RedisService } from 'src/config/cache/config.service';
import { dynamicCatchException } from 'src/utils/error.utils';

@Injectable()
export class ClientStoreService {
	constructor(
		@InjectModel(Store.name) private readonly storeModel: Model<Store>,
		@InjectModel(Company.name) private readonly companyModel: Model<Company>,
		@InjectModel(POS.name) private readonly posModel: Model<Company>,
		@InjectModel(User.name) private readonly userModel: Model<User>,
		private readonly redisService: RedisService
	) {}

	async seedStoreData(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne<IPOS>({
				name: posName,
			});

			const CompaniesList: ICompany[] = await this.companyModel.find<ICompany>({
				isActive: true,
				posId: posData._id,
			});

			for (let i = 0; i < CompaniesList.length; i++) {
				const companyData = CompaniesList[i];

				const options = {
					method: 'get',
					url: `${posData.liveUrl}/v0/clientsLocations`,
					headers: {
						key: companyData.dataObject.key,
						ClientId: companyData.dataObject.clientId,
						Accept: 'application/json',
					},
				};
				const { data } = await axios.request(options);
				const storeData = data.data;
				const storeArea: Array<IStore> = [];
				for (let index = 0; index < storeData.length; index++) {
					const element: IStoreResponseFlowHub = storeData[index];

					const existingStore = await this.storeModel.findOne({
						'location.importId': element.importId,
						companyId: companyData._id,
					});

					if (existingStore) {
						continue;
					}
					storeArea.push({
						location: {
							locationId: element.locationId,
							importId: element.importId,
						},
						companyId: companyData._id,
						hoursOfOperation: element.hoursOfOperation,
						phonenumber: element.phoneNumber,
						email: element.email ? element.email : '',
						address: element.address,
						timeZone: element.timeZone,
						licenseType: element.licenseType,
						imageUrl: element.locationLogoURL,
						website: element.website,
						locationName: element.locationName,
					});
				}

				if (storeArea.length > 0) {
					await this.storeModel.insertMany(storeArea);
				}
			}
		} catch (error) {
			console.error('Error While Seeding the Data For Store' + error);
			return error;
		}
	}

	async getStores(req) {
		try {
			const { user } = req;
			const userData = await this.userModel.findById(user.userId);
			let stores: any;

			if (user.type === USER_TYPE.SUPER_ADMIN || user.type === USER_TYPE.ADMIN) {
				stores = await this.storeModel.find({}).select(['-createdAt', '-updatedAt', '-__v']);
			} else if (user.type === USER_TYPE.COMPANY_ADMIN) {
				stores = await this.storeListByCompanyId(userData.companyId);
			} else {
				stores = [await this.storeById(userData.storeId)];
			}

			return stores;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error);
		}
	}

	async storeById(id: string): Promise<IStore> {
		try {
			const cachedStoreData: IStore = JSON.parse(await this.redisService.getValue(id));
			if (cachedStoreData) {
				return cachedStoreData;
			} else {
				const store: IStore = await this.storeModel.findById(id);
				if (!store) throw Error('Store not found.');
				await this.redisService.setValue(store._id.toString(), store);
				return store;
			}
		} catch (error) {
			console.error(error);
			dynamicCatchException(error);
		}
	}

	async storeListByCompanyId(companyId: string): Promise<any> {
		try {
			const store = await this.storeModel
				.find({ companyId, isActive: true, isDeleted: false })
				.select(['-createdAt', '-updatedAt', '-__v']);
			if (!store) throw Error('Store not found.');
			return store;
		} catch (error) {
			console.error(error);
			dynamicCatchException(error);
		}
	}

	async updateStoreData(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne<IPOS>({
				name: posName,
			});

			const CompaniesList: ICompany[] = await this.companyModel.find<ICompany>({
				isActive: true,
				posId: posData._id,
			});

			for (let i = 0; i < CompaniesList.length; i++) {
				const companyData = CompaniesList[i];

				const options = {
					method: 'get',
					url: `${posData.liveUrl}/v0/clientsLocations`,
					headers: {
						key: companyData.dataObject.key,
						ClientId: companyData.dataObject.clientId,
						Accept: 'application/json',
					},
				};
				const { data } = await axios.request(options);
				const storeData = data.data;
				for (let index = 0; index < storeData.length; index++) {
					const element: IStoreResponseFlowHub = storeData[index];

					const existingStore = await this.storeModel.findOne({
						'location.importId': element.importId,
						companyId: companyData._id,
					});

					if (existingStore) {
						await this.storeModel.findByIdAndUpdate(
							{ _id: existingStore._id },
							{ locationName: element.locationName }
						);
						console.log(element.locationName);
					}
				}
			}
		} catch (error) {
			console.error('Error While Seeding the Data For Store' + error);
			return error;
		}
	}
}
