import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { AppliesTo, Category, CustomerType, IOrder, ItemsInCart, Payments, Totals } from '../interfaces/order.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.ORDER, timestamps: true })
export class Order extends Model<IOrder> {
	@Prop({ required: true })
	_id: string;

	@Prop({ required: true })
	clientId: string;

	@Prop({ trim: true })
	customerId: string;

	@Prop()
	currentPoints: number;

	@Prop()
	Name: string;

	@Prop({})
	orderStatus: string;

	@Prop({})
	orderType: string;

	@Prop()
	orderId: string;

	@Prop(
		raw({
			FinalTotal: { type: Number },
			SubTotal: { type: Number },
			TotalDiscounts: { type: Number },
			TotalFees: { type: Number },
			TotalTaxes: { type: Number },
		})
	)
	totals: Totals;

	@Prop(
		raw([
			{
				id: { type: String },
			},
		])
	)
	itemsInCart: ItemsInCart;

	@Prop({ enum: CustomerType })
	customerType: CustomerType;

	@Prop()
	locationId: string;

	@Prop()
	voided: boolean;

	@Prop()
	fullName: string;

	@Prop()
	staffId: string;

	@Prop(
		raw([
			{
				_id: { type: String },
				paymentType: { type: String },
				amount: { type: Number },
				cardId: { type: String },
				loyaltyPoints: { type: Number },
				debitProvider: { type: String },
				balanceAfterPayment: { type: Number },
			},
		])
	)
	payments: Payments;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
