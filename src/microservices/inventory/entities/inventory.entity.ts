import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { IInventory } from '../interfaces/inventory.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.INVENTORY, timestamps: true })
export class Inventory extends Model<IInventory> {
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

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.PRODUCT })
	productId: string;

	@Prop()
	quantity: number;

	@Prop()
	posProductId: string;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.STORES })
	storeId: string;

	@Prop()
	locationName: string;

	@Prop()
	expirationDate: Date;

	@Prop()
	productUpdatedAt: Date;

	@Prop()
	sku: string;

	@Prop(
		raw({
			currencyCode: { type: String },
			inventoryUnitOfMeasureToGramsMultiplier: { type: Number },
			inventoryUnitOfMeasure: { type: String },
		})
	)
	extraDetails: Types.Subdocument;
	@Prop({ default: 0 })
	costInMinorUnits: number;
	@Prop({ default: 0 })
	priceInMinorUnits: number;
	@Prop({ default: false })
	forSale: boolean;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
