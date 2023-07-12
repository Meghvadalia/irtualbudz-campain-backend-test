import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IStaff } from '../interfaces/staff.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.STAFF, timestamps: true })
export class Staff extends Model<IStaff> {
	@Prop()
	staffName: String;

	@Prop({ required: true, type: Types.ObjectId, ref: DATABASE_COLLECTION.STORES })
	storeId: String;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
