import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { log } from 'console';
import { Model } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { ICompany } from 'src/model/company/interface/company.interface';
import { POS } from 'src/model/pos/entities/pos.entity';
import { IPOS } from 'src/model/pos/interface/pos.interface';
@Injectable()
export class seederService {
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
			const posSeedData: IPOS = {
				name: 'flowhub',
				liveUrl: 'https://api.flowhub.co/',
				stagingUrl:
					'https://stoplight.io/mocks/flowhub/public-developer-portal/24055485',
				documentationUrl:
					'https://flowhub.stoplight.io/docs/public-developer-portal',
			};
			let checkExistingPOS: Array<IPOS> = await this.posModel.find({
				name: 'flowhub',
			});
			if (checkExistingPOS.length == 0) {
				await this.posModel.create(posSeedData);
			}
			// Add more objects as needed

			console.log('POS seeding Done');
		} catch (error) {
			console.log('Error Seeding POS collection:', error);
		}
	}
	async seedCompany() {
		try {
			// Retrieve the Pos documents
			const companySeedData: Array<ICompany> = [
				{
					name: 'Monarc',
					posId: '',
					totalStore: 0,
					dataObject: {
						clientId: 20,
						key: 'c6c3f269-33e6-43ea-922e-4ab83d4ba0d7',
					},
				},
				// Add more objects as needed
			];
			let checkExistingPOS: Array<IPOS> = await this.companyModel.find({
				name: 'Monarc',
			});
			if (checkExistingPOS.length == 0) {
				const posDocuments = await this.posModel.find({
					name: 'flowhub',
				});

				// Create the companySeedData with posID referencing the Pos documents
				const seededCompanyData = companySeedData.map((data) => {
					const { posId } = data;

					const posID = posDocuments.find(
						(pos) => pos.name === 'flowhub'
					)._id;
					return { ...data, posId: posID };
				});

				await this.companyModel.create(seededCompanyData);
			}

			console.log('Company collection seeded successfully.');
		} catch (error) {
			console.error('Error seeding Company collection:', error);
		}
	}
	async seedCollections() {
		await this.seedPOS();
		setTimeout(async () => {
			await this.seedCompany();
		}, 500);
	}
}
