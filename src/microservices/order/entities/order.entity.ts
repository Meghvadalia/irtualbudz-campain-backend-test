import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { IOrder, Payments, Totals } from '../interfaces/order.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { CUSTOMER_TYPE } from '../constant/order.constant';

@Schema({ collection: DATABASE_COLLECTION.ORDER, timestamps: true })
export class Order extends Model<IOrder> {
	@Prop({
		required: true,
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.COMPANIES,
	})
	companyId: string;

	@Prop({
		required: true,
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.POS,
	})
	posId: string;

	@Prop({ required: true, unique: true })
	posOrderId: string;

	@Prop({ trim: true })
	clientId: string;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.CUSTOMER })
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

	@Prop({ enum: CUSTOMER_TYPE })
	customerType: string;

	@Prop({
		required: true,
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.STORES,
		index: true,
	})
	storeId: string;

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
OrderSchema.index({ customerId: 1 }, { unique: true })
OrderSchema.index({ itemsInCart: 1 }, { unique: true })
