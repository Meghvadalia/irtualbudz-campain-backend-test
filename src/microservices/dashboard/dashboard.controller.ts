import { Controller, Get, Res } from '@nestjs/common';
import { DashboardService } from './dashborad.service';
import { Response } from 'express';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	async getCalculatedData(@Res() res: Response) {
		try {
			const {
				averageAge,
				averageSpend,
				loyaltyPointsConverted,
				paymentSum: totalSales,
				totalDiscounts,
			} = await this.dashboardService.getCalculatedData();

			return res.json({ averageAge, averageSpend, loyaltyPointsConverted, totalSales, totalDiscounts });
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
}
