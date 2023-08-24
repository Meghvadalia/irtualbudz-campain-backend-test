import { Controller, Get } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeederService } from 'src/common/seeders/seeders';
import { CustomerService } from 'src/microservices/customers';
import { InventoryService } from 'src/microservices/inventory';
import { OrderService } from 'src/microservices/order/services/order.service';

@Controller('dutchie')
export class DutchieController {
	constructor(
		private readonly storeService: SeederService,
		private readonly customerService: CustomerService,
		private readonly orderService: OrderService,
		private readonly inventoryService: InventoryService
	) {}

	@Get('seed')
	@Cron(CronExpression.EVERY_DAY_AT_5AM)
	async seedData() {
		const seedValue = 'dutchie';

		// try {
		// 	await this.storeService.seedDutchieStores(seedValue);
		// 	console.log('Dutchie stores seeded successfully');
		// } catch (error) {
		// 	console.error('Error seeding Dutchie stores:', error);
		// }

		// try {
		// 	await this.orderService.seedDutchieStaff(seedValue);
		// 	console.log('Dutchie staff seeded successfully');
		// } catch (error) {
		// 	console.error('Error seeding Dutchie staff:', error);
		// }

		// try {
		// 	await this.inventoryService.seedDutchieInventory(seedValue);
		// 	console.log('Dutchie inventory seeded successfully');
		// } catch (error) {
		// 	console.error('Error seeding Dutchie inventory:', error);
		// }

		// try {
		// 	await this.customerService.seedDutchieCustomers(seedValue);
		// 	console.log('Dutchie customers seeded successfully');
		// } catch (error) {
		// 	console.error('Error seeding Dutchie customers:', error);
		// }

		try {
			await this.orderService.seedDutchieOrders(seedValue);
			console.log('Dutchie orders seeded successfully');
		} catch (error) {
			console.error('Error seeding Dutchie orders:', error);
		}
	}
}
