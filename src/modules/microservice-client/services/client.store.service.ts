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
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ClientStoreService {
	constructor(
		@InjectModel(Store.name) private storeModel: Model<IStore>,
		@InjectModel(Company.name) private companyModel: Model<ICompany>,
		@InjectModel(POS.name) private posModel: Model<ICompany>
	) {}

	@Cron('0 0 0 * * *')
	async seedStoreData() {
		try {
			const monarcCompanyData: ICompany = await this.companyModel.findOne<ICompany>({
				name: 'Monarc',
			});

			const posData: IPOS = await this.posModel.findOne<IPOS>({
				_id: monarcCompanyData.posId,
			});

			const options = {
				method: 'get',
				url: posData.liveUrl + 'v0/clientsLocations',
				headers: {
					key: monarcCompanyData.dataObject.key,
					ClientId: monarcCompanyData.dataObject.clientId,
					Accept: 'application/json',
				},
			};
			const { data } = await axios.request(options);
			const storeData = data.data;
			let storeArea: Array<IStore> = [];
			for (let index = 0; index < storeData.length; index++) {
				const element: IStoreResponseFlowHub = storeData[index];
				storeArea.push({
					location: {
						locationId: element.locationId,
						importId: element.importId,
					},
					companyId: monarcCompanyData._id,
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

			return storeArea;
		} catch (error) {
			console.log('Error While Seeding the Data For Store', error);
			return error;
		}
	}

	async getStores() {
		try {
			return await this.storeModel.find({});
		} catch (error) {
			throw error;
		}
	}
}
