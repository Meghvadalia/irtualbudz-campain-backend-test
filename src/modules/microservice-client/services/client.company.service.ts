import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { User } from 'src/microservices/user/entities/user.entity';
import { IUser } from 'src/microservices/user/interfaces/user.interface';
import { UsersService } from 'src/microservices/user/service/users.service';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';

@Injectable()
export class ClientCompanyService {
	constructor(
		@InjectModel(Company.name) private companyModel: Model<ICompany>,
		@InjectModel(User.name) private userModel: Model<IUser>
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
			throw error;
		}
	}

	async company(id: string): Promise<ICompany | null> {
		try {
			const company = await this.companyModel.findById(id).select(['-updatedAt', '-createdAt', '-__v']);
			if (!company) throw Error('Company not found.');
			return company;
		} catch (error) {
			throw error;
		}
	}
}
