import { Controller, Get, Query, Res } from '@nestjs/common';
import { DashboardService } from './dashborad.service';
import { Response } from 'express';

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
}
