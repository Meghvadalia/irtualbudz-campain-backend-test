import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { WeightTierInformation, Category, CannabinoidInformation, IInventory} from '../interfaces/inventory.interface';

@Schema({ collection: 'Inventory', timestamps: true })
export class Inventory extends Model<IInventory> {
	@Prop({ required: true })
	productId: string;

	@Prop({ required: true })
	clientId: string;

	@Prop({ trim: true })
	productDescription: string;

	@Prop()
	productName: string;

	@Prop()
	priceInMinorUnits: string;

	@Prop({})
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
	productUnitOfMeasureToGramsMultiplier: string

	@Prop()
	productWeight: number

	@Prop(
		raw([
			{
				name: { type: String },
				gramAmount: { type: String },
				pricePerUnitInMinorUnits: { type: Number }
			}
		])
	)
	weightTierInformation: WeightTierInformation

	@Prop(
		raw([
			{
				name:{ type: String },
				lowerRange:{ type: Number },
				upperRange:{ type: Number },
				unitOfMeasure:{ type: String },
				unitOfMeasureToGramsMultiplier:{ type: String },
			}
		])
	)
	cannabinoidInformation: CannabinoidInformation

	@Prop()
	quantity: number;

	@Prop()
	inventoryUnitOfMeasure: string;

	@Prop()
	inventoryUnitOfMeasureToGramsMultiplier: number;

	@Prop()
	locationId: number;

	@Prop()
	locationName: string;

	@Prop()
	currencyCode: string;

	@Prop()
	expirationDate: string;

	@Prop()
	speciesName: string;

	@Prop()
	productUpdatedAt: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
