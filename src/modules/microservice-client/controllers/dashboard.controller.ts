import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { Response } from 'express';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get('/:locationId')
	async getCalculatedData(
		@Param('locationId') locationId: string,
		@Query() query: { fromDate: string; toDate: string },
		@Res() res: Response
	) {
		try {
			const { customer, overview, sales, operations } = await this.dashboardService.getCalculatedData(locationId, query);

			return res.json({ overview, customer, sales, operations });
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
}
