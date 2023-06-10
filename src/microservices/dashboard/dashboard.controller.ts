import { Controller, Get, Query, Res } from '@nestjs/common';
import { DashboardService } from './dashborad.service';
import { Response, query } from 'express';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	async getCalculatedData(@Query() query: { fromDate: string; toDate: string }, @Res() res: Response) {
		try {
			const { customer, overview } = await this.dashboardService.getCalculatedData(query);

			return res.json({ overview, customer });
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	@Get('/range')
	async getCalculatedDataByRange(@Query() query: { fromDate: string; toDate: string }, @Res() res: Response) {
		try {
			const { paymentGrowth, percentageGrowth } = await this.dashboardService.totalSales(query);

			return res.json({ growth: paymentGrowth, percentageGrowth });
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
}
