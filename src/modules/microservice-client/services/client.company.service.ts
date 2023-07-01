import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';

@Injectable()
export class ClientCompanyService {
	constructor(@InjectModel(Company.name) private companyModel: Model<ICompany>) {}

	async companyList() {
		try {
			return await this.companyModel.find({}).select(['-updatedAt', '-createdAt', '-__v']);
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
