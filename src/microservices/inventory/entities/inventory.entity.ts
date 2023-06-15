import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IInventory } from '../interfaces/inventory.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.INVENTORY, timestamps: true })
export class Inventory extends Model<IInventory> {
	@Prop({ required: true, unique: true })
	posProductId: string;

	@Prop({ required: true, type: Types.ObjectId, ref: DATABASE_COLLECTION.COMPANIES })
	companyId: string;

	@Prop({ required: true, type: Types.ObjectId, ref: DATABASE_COLLECTION.POS })
	posId: string;

	@Prop({ type: [{ type: Types.ObjectId, ref: DATABASE_COLLECTION.PRODUCT }] })
	productId: string;

	@Prop({ required: true })
	clientId: string;

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
	productUpdatedAt: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
