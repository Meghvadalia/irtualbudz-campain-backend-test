import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { User } from 'src/microservices/user/entities/user.entity';
import { IUser } from 'src/microservices/user/interfaces/user.interface';
import { UsersService } from 'src/microservices/user/service/users.service';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany, ICompanyRequest } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
import { dynamicCatchException, throwNotFoundException } from 'src/utils/error.utils';

@Injectable()
export class ClientCompanyService {
	// posModel: any;
	constructor(
		@InjectModel(Company.name) private companyModel: Model<ICompany>,
		@InjectModel(User.name) private userModel: Model<IUser>,
		@InjectModel(POS.name) private posModel: Model<IPOS>
	) {}

	async companyList(req) {
		try {
			const { user } = req;
			if (user.type === USER_TYPE.SUPER_ADMIN || user.type === USER_TYPE.ADMIN) {
				return await this.companyModel.find({}).select(['-updatedAt', '-createdAt', '-__v']);
			} else {
				const userData = await this.userModel.findById(user.userId);
				const company = await this.company(userData.companyId);
				return company;
			}
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async company(id: string): Promise<ICompany | null> {
		try {
			const company = await this.companyModel
				.findById(id)
				.select(['-updatedAt', '-createdAt', '-__v']);
			if (!company) throwNotFoundException('Company not found.');
			return company;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async createCompany(payload: ICompanyRequest) {
		try {
			if (!payload.posName) {
				throw new RpcException('posId is required');
			}
			const pos = await this.posModel.findOne({ name: payload.posName });
			if (!pos) {
				throw new RpcException('POS not found or inactive');
			}
			const companyData = {
				name: payload.companyName,
				posId: pos._id,
				totalStore: 0,
				dataObject: payload.dataObject,
				lastSyncDataDuration: 300,
			};
			const Company = await this.companyModel.create(companyData);
			return Company;
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
