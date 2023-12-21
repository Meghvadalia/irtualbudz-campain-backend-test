import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { AppliesTo, ItemDiscounts, ItemsCart, Tax } from '../interfaces/cart.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.CART, timestamps: true })
export class Cart extends Model<ItemsCart> {
	@Prop({ required: true, unique: false })
		posCartId: string;

	@Prop({
		required: true,
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.STORES,
	})
		storeId: string;

	@Prop()
		sku: string;

	@Prop()
		category: string;

	@Prop()
		title1: string;

	@Prop()
		title2: string;

	@Prop()
		productName: string;

	@Prop()
		strainName: string;

	@Prop()
		unitOfWeight: string;

	@Prop()
		quantity: number;

	@Prop()
		unitPrice: number;

	@Prop()
		totalPrice: number;

	@Prop()
		unitCost: number;

	@Prop()
		totalCost: number;

	@Prop(
		raw([
			{
				_id: { type: String },
				name: { type: String },
				type: { type: String },
				discountAmount: { type: Number },
				discountType: { type: String },
				discountId: { type: String },
				ItemDiscounts: { type: String },
				dollarsOff: { type: Number },
				penniesOff: { type: Number },
				percentOff: { type: Number },
				discounterName: { type: String },
				discounterId: { type: String },
				isCartDiscount: { type: String },
				couponCode: { type: String },
				quantity: { type: Number },
			},
		])
	)
		itemDiscounts: ItemDiscounts[];

	@Prop(
		raw([
			{
				_id: { type: String },
				name: { type: String },
				percentage: { type: Number },
				calculateBeforeDiscounts: { type: String },
				supplierSpecificTax: { type: Boolean },
				excludeCustomerGroups: { type: [String] },
				enableCostMarkup: { type: Boolean },
				markupPercentage: { type: Number },
				thisTaxInPennies: { type: Number },
				appliesTo: { type: String, enum: AppliesTo },
			},
		])
	)
		tax: Tax[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ sku: 1, storeId: 1 });
