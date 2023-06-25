import { Controller, Get } from '@nestjs/common';
import { DutchieService } from '../services/dutchie.service';

@Controller('dutchie')
export class DutchieDataSeeder {
	constructor(private readonly dutchieService: DutchieService) {}

	@Get('seed')
	async seedData() {
		// const customerData = await this.dutchieService.seedCustomers();
		// const inventoryData = await this.dutchieService.seedInventories();
		// const productData = await this.dutchieService.seedProducts();
		const employeeData = await this.dutchieService.seedStaff();
	}
}
