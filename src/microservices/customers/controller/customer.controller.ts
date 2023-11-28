import { Controller, SerializeOptions } from '@nestjs/common';

import { extendedUserGroupsForSerializing } from '../index';

@Controller('customer')
@SerializeOptions({
	groups: extendedUserGroupsForSerializing,
})
export class CustomerController {
	constructor() {}

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
