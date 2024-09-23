import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { Store } from 'src/model/store/entities/store.entity';
import { IStore } from 'src/model/store/interface/store.inteface';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IStoreResponseFlowHub } from 'src/common/interface';
import { User } from 'src/microservices/user/entities/user.entity';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { RedisService } from 'src/config/cache/config.service';
import { dynamicCatchException } from 'src/utils/error.utils';
import { UPLOAD_DIRECTORY } from 'src/common/constants';
import { createDirectoryIfNotExists, uploadFiles } from 'src/utils/fileUpload';
import * as path from 'path';

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
				let storeData;
				try {
					const { data } = await axios.request(options);
					storeData = data.data;
				} catch (error) {
					console.log('Error while Seeding the store for company '+ companyData.name);
					continue;
				}
				
				
				const storeArea: Array<IStore> = [];
				for (let index = 0; index < storeData.length; index++) {
					const element: IStoreResponseFlowHub = storeData[index];

					const existingStore = await this.storeModel.findOne({
						'location.importId': element.importId,
						companyId: companyData._id,
					});

					if (existingStore) {
						if (!existingStore.brandId) {
							const createBrandData = {
								storeName: element.locationName,
								storeEmail: element.email ? element.email : '',
								password: '1234567890',
								storeTimezone: element.timeZone,
							};

							let brandData;
							try {
								brandData = await this.createBrand(createBrandData);
							} catch (error) {
								console.log(error);
							}

							await this.storeModel.findByIdAndUpdate(existingStore._id, {
								brandId: brandData?.data?.data?.appId || null,
								sendyUserId: brandData?.data?.data?.loginId || null,
							});
						}
						continue;
					}

					const createBrandData = {
						storeName: element.locationName,
						storeEmail: element.email ? element.email : '',
						password: '1234567890',
						storeTimezone: element.timeZone,
					};

					let brandData;
					try {
						brandData = await this.createBrand(createBrandData);
					} catch (error) {
						console.log(error);
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
						brandId: brandData?.data?.data?.appId || null,
						sendyUserId: brandData?.data?.data?.loginId || null,
					});
				}

				if (storeArea.crolength > 0) {
					await this.storeModel.insertMany(storeArea);
				}
			}
		} catch (error) {
			console.error('Error While Seeding the Data For Store: ', error);
			return error;
		}
	}

	async createBrand(brandData: any): Promise<AxiosResponse> {
		const credentials = Buffer.from(
			`${process.env.TRACKING_AUTH_USERNAME}:${process.env.TRACKING_AUTH_PASSWORD}`
		).toString('base64');
		const brandApiUrl = `${process.env.TRACKING_SERVER}/brandCreate/brand`;
		const headers: AxiosRequestConfig['headers'] = {
			'Content-Type': 'application/json',
			Authorization: `Basic ${credentials}`,
		};

		try {
			const response = await axios.post(brandApiUrl, brandData, { headers });
			return response;
		} catch (error) {
			console.error('Error while creating brand:', error);
			throw error;
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
					}
				}
			}
		} catch (error) {
			console.error('Error While Seeding the Data For Store' + error);
			return error;
		}
	}

	async updateStores(id: string, logos: Express.Multer.File[] | undefined, data: any) {
		try {
			const directory = path.join(process.cwd(), 'public', UPLOAD_DIRECTORY.LOGO);
			await createDirectoryIfNotExists(directory);

			let updateFields = {};

			if (logos && logos.length > 0) {
				const filePaths = await uploadFiles(logos, directory);
				updateFields = { logos: filePaths };
			} else if (data) {
				updateFields = { ...data };
			}

			const updateStore = await this.storeModel.findByIdAndUpdate(
				{ _id: new Types.ObjectId(id) },
				{
					$set: updateFields,
				},
				{ new: true }
			);
			return updateStore;
		} catch (error) {
			console.error('Error While Updating the Data For Store', error);
			throw error;
		}
	}
}
