import { Controller, Get } from '@nestjs/common';
import { DutchieService } from '../services/dutchie.service';

@Controller('dutchie')
export class DutchieDataSeeder {
	constructor(private readonly dutchieService: DutchieService) {}

	@Get('seed')
	async seedData() {
		await this.dutchieService.seedCustomers();
		await this.dutchieService.seedInventories();
		await this.dutchieService.seedProducts();
		await this.dutchieService.seedStaff();
	}
}
