import { Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ClientCategoryService } from '../services/client.category.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('category')
export class ClientCategoryController {
	constructor(private readonly clientCategoryService: ClientCategoryService) {}

	@Post('add')
	@UseInterceptors(FilesInterceptor('images'))
	async addCategory(@Body() data, @UploadedFiles() files: Express.Multer.File[]) {
		try {
			const category = await this.clientCategoryService.addCategory(data, files);
			return sendSuccess(category, 'Category created successfully');
		} catch (error) {
			console.error('Error: ' + error.message);
			return sendError(error.message, error.status);
		}
	}

	@Post('get')
	async getMatchingCategory(@Body() data: { category: string[] }) {
		try {
			const category = await this.clientCategoryService.getMatchingCategories(data.category);
			return sendSuccess(category, 'Categories fetched successfully', 200);
		} catch (error) {
			console.error('Error: ' + error.message);
			return sendError(error.message, error.status);
		}
	}
}
