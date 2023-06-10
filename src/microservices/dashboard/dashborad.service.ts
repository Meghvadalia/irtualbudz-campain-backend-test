import { Injectable } from '@nestjs/common';
import { CustomerService } from '../customers/customer.service';
import { OrderService } from '../order/services/order.service';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from '../order/entities/cart.entity';
import { Model } from 'mongoose';

@Injectable()
export class DashboardService {
	constructor(
		@InjectModel(Cart.name) private cartModel: Model<Cart>,
		private readonly customerService: CustomerService,
		private readonly orderService: OrderService
	) {}

	async getCalculatedData() {
		const age = await this.calculateAverageAge();

		const sum = age.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		const averageAge = (sum / age.length).toFixed(1);

		const { averageSpend, loyaltyPointsConverted, paymentSum } = await this.calculateAverageSpendAndLoyaltyPoints();

		const totalDiscounts = await this.totalDiscounts();

		// const brandTotal = await this.calculatebrandTotal();

		return {
			averageAge,
			averageSpend,
			loyaltyPointsConverted,
			paymentSum,
			totalDiscounts,
		};
	}

	async calculateAverageAge() {
		const ageArray: number[] = [];
		const users = await this.customerService.getCustomers();

		users.map((user) => {
			const birthDate = new Date(user.birthDate);
			const now = new Date();
			let age = now.getFullYear() - birthDate.getFullYear();

			const hasBirthdayPassed =
				now.getMonth() > birthDate.getMonth() ||
				(now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
			if (!hasBirthdayPassed) {
				age--;
			}

			ageArray.push(age);
		});
		return ageArray;
	}

	async calculatebrandTotal() {
		const orderList = await this.orderService.getOrders();
		const cartItems = orderList.flatMap((order) => {
			return order.itemsInCart;
		});

		for (let item of cartItems) {
			const itemId = item._id.toString();
			console.log(itemId);
			try {
				const products = await this.cartModel.find({ _id: itemId });
				console.log({ products });
			} catch (error) {
				console.error(error);
			}
		}
	}

	async calculateAverageSpendAndLoyaltyPoints() {
		const orderList = await this.orderService.getOrders();

		const payments = orderList.flatMap((order) => order.payments).map((payment) => payment.amount);

		const paymentSum = payments.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		const average = (paymentSum / payments.length).toFixed(2);

		const loyaltyPoints = orderList
			.flatMap((order) => order.payments)
			.map((payment) => payment.loyaltyPoints)
			.filter((loyaltyPoints) => typeof loyaltyPoints === 'number');

		const loyaltyPointsSum = loyaltyPoints.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

		return {
			averageSpend: average,
			loyaltyPointsConverted: loyaltyPointsSum,
			paymentSum,
		};
	}

	async totalDiscounts() {
		const orderList = await this.orderService.getOrders();

		const payments = orderList.flatMap((order) => order.totals).map((total) => total.totalDiscounts);

		const totalDiscounts = payments.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		return totalDiscounts;
	}

	async topSellingCategory() {}

	// async loyaltyPointsConverted() {
	// 	const orderList = await this.orderService.getOrders();

	// 	const loyaltyPoints = orderList
	// 		.flatMap((order) => order.payments)
	// 		.map((payment) => payment.loyaltyPoints)
	// 		.filter((loyaltyPoints) => typeof loyaltyPoints === 'number');

	// 	const loyaltyPointsSum = loyaltyPoints.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

	// 	return loyaltyPointsSum;
	// }

	// async calculateAverageSpend() {
	// 	const orderList = await this.orderService.getOrders();

	// 	const payments = orderList
	// 		.flatMap((order) => {
	// 			return order.payments;
	// 		})
	// 		.map((payment) => payment.amount);

	// 	const paymentSum = payments.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
	// 	const average = (paymentSum / payments.length).toFixed(2);

	// 	return average;
	// }
}
