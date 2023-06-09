import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { IStaff } from '../interfaces/staff.interface';

@Schema({ collection: 'Staff', timestamps: true })
export class Staff extends Model<IStaff> {
	@Prop()
	staffName: String;
	@Prop()
	storeId: String;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
