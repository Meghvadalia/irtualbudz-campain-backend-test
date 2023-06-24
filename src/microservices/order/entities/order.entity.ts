import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { CustomerType, IOrder, Payments, Totals } from '../interfaces/order.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.ORDER, timestamps: true })
export class Order extends Model<IOrder> {
	@Prop({ required: true, unique: true })
	posOrderId: string;

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

	@Prop(
		raw({
			finalTotal: { type: Number },
			subTotal: { type: Number },
			totalDiscounts: { type: Number },
			totalFees: { type: Number },
			totalTaxes: { type: Number },
		})
	)
	totals: Totals;

	@Prop()
	itemsInCart: string[];

	@Prop({ enum: CustomerType })
	customerType: CustomerType;

	@Prop({ index: true })
	locationId: string;

	@Prop()
	voided: boolean;

	@Prop()
	posCreatedAt: Date;

	@Prop()
	fullName: string;

	@Prop()
	staffId: Types.ObjectId;

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
