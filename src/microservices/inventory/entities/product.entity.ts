import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { WeightTierInformation, CannabinoidInformation } from '../interfaces/product.interface';
import { IProduct } from '../interfaces/product.interface';

@Schema({ collection: 'Product', timestamps: true })
export class Product extends Model<IProduct> {
	@Prop({ required: true })
	clientId: string;

	@Prop({ trim: true })
	productName: string;

	@Prop({ trim: true })
	productDescription: string;

	@Prop()
	priceInMinorUnits: number;

	@Prop()
	sku: string;

	@Prop({})
	nutrients: string;

	@Prop()
	productPictureURL: string;

	@Prop()
	purchaseCategory: string;

	@Prop()
	category: string;

	@Prop()
	type: string;

	@Prop()
	brand: string;

	@Prop()
	isMixAndMatch: boolean;

	@Prop()
	isStackable: boolean;

	@Prop()
	productUnitOfMeasure: string;

	@Prop()
	productUnitOfMeasureToGramsMultiplier: string;

	@Prop()
	productWeight: number;

	@Prop(
		raw([
			{
				name: { type: String },
				gramAmount: { type: String },
				pricePerUnitInMinorUnits: { type: Number },
			},
		])
	)
	weightTierInformation: WeightTierInformation;

	@Prop(
		raw([
			{
				name: { type: String },
				lowerRange: { type: Number },
				upperRange: { type: Number },
				unitOfMeasure: { type: String },
				unitOfMeasureToGramsMultiplier: { type: String },
			},
		])
	)
	cannabinoidInformation: CannabinoidInformation;

	@Prop()
	speciesName: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
