import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { POS } from 'src/model/pos/entities/pos.entity';
import { posData } from './pos';
import { companyData } from './company';

@Injectable()
export class SeederService {
	constructor(
		@InjectModel(POS.name)
		private posModel: Model<POS>,
		@InjectModel(Company.name)
		private companyModel: Model<Company>
	) {
		setTimeout(() => {
			this.seedCollections();
		}, 300);
	}

	async seedPOS() {
		try {
			for (const pos of posData) {
				const existingPOS = await this.posModel.findOne({ name: pos.name });

				if (!existingPOS) {
					await this.posModel.create(pos);
				}
			}

			console.log('POS seeding Done');
		} catch (error) {
			console.error('Error Seeding POS collection:', error);
		}
	}

	async seedCompany() {
		try {
			for (const company of companyData) {
				const existingCompany = await this.companyModel.findOne({ name: company.name });

				if (!existingCompany) {
					let posName: string;
					if (company.name === 'Monarc') {
						posName = 'flowhub';
					} else if (company.name === 'Dutchie') {
						posName = 'dutchie';
					}

					const matchingPOS = await this.posModel.findOne({ name: posName });

					if (matchingPOS) {
						await this.companyModel.create({
							name: company.name,
							posId: matchingPOS._id,
							totalStore: company.totalStore,
							dataObject: company.dataObject,
						});
					}
				}
			}

			console.log('Company seeding Done');
		} catch (error) {
			console.error('Error seeding Company collection:', error);
		}
	}

	async seedCollections() {
		try {
			await this.seedPOS();
			await this.seedCompany();
			console.log('Seeding completed successfully');
		} catch (error) {
			console.error('Error seeding collections:', error);
		}
	}
}
