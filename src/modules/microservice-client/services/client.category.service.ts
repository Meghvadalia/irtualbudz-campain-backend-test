import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from 'path';
import * as stringSimilarity from 'string-similarity';
import { UPLOAD_DIRECTORY } from 'src/common/constants';
import { Category } from 'src/model/category/entities/category.entity';
import { ICategory } from 'src/model/category/interfaces/category.interface';
import { dynamicCatchException } from 'src/utils/error.utils';
import { createDirectoryIfNotExists, uploadFiles } from 'src/utils/fileUpload';

@Injectable()
export class ClientCategoryService {
	constructor(@InjectModel(Category.name) private readonly categoryModel: Model<Category>) {}

	async addCategory(data: ICategory, images: Express.Multer.File[]) {
		try {
			const directory = path.join(process.cwd(), 'public', UPLOAD_DIRECTORY.CATEGORY);
			await createDirectoryIfNotExists(directory);

			const filePaths = await uploadFiles(images, directory);

			const newCategory = await this.categoryModel.create({ name: data.name, images: filePaths });
			return {
				name: newCategory.name,
				images: newCategory.images,
			};
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async getMatchingCategories(categories: string[]) {
		try {
			const matchingCategories = [];

			for (const keyword of categories) {
				const categoryData = await this.categoryModel.findOne({
					name: { $regex: new RegExp(keyword, 'i') },
				});

				if (categoryData) {
					matchingCategories.push({
						_id: categoryData._id,
						name: categoryData.name,
						images: categoryData.images,
					});
				} else {
					const allCategories = await this.categoryModel.find({}, 'name images');

					const matches = stringSimilarity.findBestMatch(
						keyword.toLowerCase(),
						allCategories.map((c) => c.name.toLowerCase())
					);

					const bestMatchIndex = matches.bestMatchIndex;
					const bestMatchRating = matches.ratings[bestMatchIndex];

					if (bestMatchRating.rating >= 0.6) {
						const matchedCategoryData = allCategories[bestMatchIndex];
						matchingCategories.push({
							_id: matchedCategoryData._id,
							name: matchedCategoryData.name,
							images: matchedCategoryData.images,
						});
					}
				}
			}

			return matchingCategories;
		} catch (error) {
			dynamicCatchException(error);
		}
	}
}
