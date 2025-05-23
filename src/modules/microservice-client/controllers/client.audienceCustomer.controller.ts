import { Controller, Get, Param } from '@nestjs/common';
import { ClientAudienceCustomerService } from '../services/client.audienceCustomer.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sendSuccess } from 'src/utils/request-response.utils';

@Controller('audience_customer')
export class AudienceCustomerController {
	constructor(private readonly audienceCustomerService: ClientAudienceCustomerService) {}

	@Get('seed')
	@Cron('0 0 1,16 * *')
	async seedCustomerAudience() {
		try {
			await this.audienceCustomerService.seedAudiceCustomers();
			return;
		} catch (error) {
			console.trace(error);
		}
	}

	@Get('frequent_flyer')
	@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
	async seedFrequentFlyerAudience() {
		try {
			await this.audienceCustomerService.frequentFlyerAudience();
			return;
		} catch (error) {
			console.trace(error);
		}
	}

	@Get('count/:campaignId')
	async audienceCustomerCount(@Param('campaignId') campaignId: string) {
		try {
			const count = await this.audienceCustomerService.getAudienceCustomerCount(campaignId);
			return sendSuccess(count);
		} catch (error) {
			console.trace(error);
		}
	}
}
