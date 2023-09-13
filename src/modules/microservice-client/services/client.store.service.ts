import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

@Injectable()
export class ClientStoreService {
	constructor(
		@InjectModel(Store.name) private storeModel: Model<IStore>,
		@InjectModel(Company.name) private companyModel: Model<ICompany>,
		@InjectModel(POS.name) private posModel: Model<ICompany>,
		@InjectModel(User.name) private userModel: Model<IUser>,
		private readonly redisService: RedisService
	) {}

	async seedStoreData(posName: string) {
		try {
			const posData: IPOS = await this.posModel.findOne<IPOS>({
				name: posName,
			});

			const CompaniesList: ICompany[] =
				await this.companyModel.find<ICompany>({
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
				let storeArea: Array<IStore> = [];
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
					});
				}

				if (storeArea.length > 0) {
					await this.storeModel.insertMany(storeArea);
				}
			}
		} catch (error) {
			console.error('Error While Seeding the Data For Store', error);
			return error;
		}
	}

	async getStores(req) {
		try {
			const { user } = req;
			const userData = await this.userModel.findById(user.userId);
			if (
				user.type === USER_TYPE.SUPER_ADMIN ||
				user.type === USER_TYPE.ADMIN
			) {
				return await this.storeModel.find({});
			} else if (user.type === USER_TYPE.COMPANY_ADMIN) {
				const stores = await this.storeListByCompanyId(
					userData.companyId
				);
				return stores;
			} else {
				const store = await this.storeById(userData.storeId);
				return store;
			}
		} catch (error) {
			throw error;
		}
	}

	async storeById(id: string): Promise<IStore> {
		try {
			const cachedStoreData: IStore = JSON.parse(
				await this.redisService.getValue(id)
			);
			if (cachedStoreData) {
				return cachedStoreData;
			} else {
				const store: IStore = await this.storeModel.findById(id);
				if (!store) throw Error('Store not found.');
				await this.redisService.setValue(store._id.toString(), store);
				return store;
			}
		} catch (error) {
			throw error;
		}
	}

	async storeListByCompanyId(companyId: string): Promise<any> {
		try {
			const store = await this.storeModel.find({ companyId });
			if (!store) throw Error('Store not found.');
			return store;
		} catch (error) {
			throw error;
		}
	}
}
