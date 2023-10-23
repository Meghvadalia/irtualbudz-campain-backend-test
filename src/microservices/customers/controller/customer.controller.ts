import { Controller, Get, SerializeOptions } from '@nestjs/common';

import { CustomerService, extendedUserGroupsForSerializing } from '../index';

@Controller('customer')
@SerializeOptions({
	groups: extendedUserGroupsForSerializing,
})
export class CustomerController {
	constructor(private readonly customerService: CustomerService) {}

	// @Get('seed')
	// async seedCustomers(): Promise<string> {
	// 	try {
	// 		await this.customerService.scheduleCronJob();
	// 		return 'Seeding cron job triggered successfully.';
	// 	} catch (error) {
	// 		throw new Error('Failed to trigger seeding cron job.');
	// 	}
	// }
}
