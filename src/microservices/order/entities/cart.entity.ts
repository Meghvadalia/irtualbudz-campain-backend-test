import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { AppliesTo, ItemDiscounts, ItemsCart, Tax } from '../interfaces/cart.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.CART, timestamps: true })
export class Cart extends Model<ItemsCart> {
	@Prop({required: true, unique: false })
	posCartId: String;
	@Prop()
	storeId: String;
	@Prop()
	sku: String;
	@Prop()
	category: String;
	@Prop()
	title1: String;
	@Prop()
	title2: String;
	@Prop()
	productName: String;
	@Prop()
	strainName: String;
	@Prop()
	unitOfWeight: String;
	@Prop()
	quantity: Number;
	@Prop()
	unitPrice: Number;
	@Prop()
	totalPrice: Number;
	@Prop()
	unitCost: Number;
	@Prop()
	totalCost: Number;

	@Prop(
		raw({
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
		})
	)
	itemDiscounts: ItemDiscounts;

	@Prop(
		raw({
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
		})
	)
	tax: ItemDiscounts;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
