import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { IInventoryUpdatedLog } from '../interface/inventoryUpdatedLog.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { Model, Types } from 'mongoose';

@Schema({ collection: DATABASE_COLLECTION.INVENTORYUPDATEDLOG, timestamps: true })
export class InventoryUpdatedLog extends Model<IInventoryUpdatedLog> {
	@Prop({
		required: true,
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.STORES,
	})
		storeId: string;
	@Prop({ trim: true })
		sku: string;
	@Prop({ trim: true })
		posProductId: string;
	@Prop({ trim: true })
		newQuantity: number;
	@Prop({ trim: true })
		oldQuantity: number;
	@Prop()
		updatedAt: Date;
	@Prop()
		posProductUpdatedAt: Date;
}

export const InventoryUpdatedLogSchema = SchemaFactory.createForClass(InventoryUpdatedLog);
InventoryUpdatedLogSchema.index({ storeId: 1, posProductUpdatedAt: 1 });
