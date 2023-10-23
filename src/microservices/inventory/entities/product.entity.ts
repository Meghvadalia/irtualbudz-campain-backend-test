import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { IProduct } from '../interfaces/product.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.PRODUCT, timestamps: true })
export class Product extends Model<IProduct> {
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

	@Prop({ trim: true })
		productName: string;

	@Prop({ trim: true })
		posProductId: string;

	@Prop({ trim: true })
		productDescription: string;

	@Prop()
		sku: string;

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
		productWeight: number;

	@Prop()
		speciesName: string;

	@Prop(
		raw({
			nutrients: { type: String },
			productUnitOfMeasure: { type: String },
			productUnitOfMeasureToGramsMultiplier: { type: String },
			isMixAndMatch: { type: Boolean },
			isStackable: { type: Boolean },
			cannabinoidInformation: [
				{
					type: {
						name: { type: String },
						lowerRange: { type: Number },
						upperRange: { type: Number },
						unitOfMeasure: { type: String },
						unitOfMeasureToGramsMultiplier: { type: String },
					},
				},
			],
			weightTierInformation: {
				name: { type: String },
				gramAmount: { type: String },
				pricePerUnitInMinorUnits: { type: Number },
			},
		})
	)
		extraDetails: Types.Subdocument;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ posProductId: 1, companyId: 1 }, { unique: true });
