import mongoose, { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { IInventory } from '../interfaces/inventory.interface';

@Schema({ collection: 'Inventory', timestamps: true })
export class Inventory extends Model<IInventory> {
	@Prop({ required: true })
	posProductId: string;

	@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] })
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
