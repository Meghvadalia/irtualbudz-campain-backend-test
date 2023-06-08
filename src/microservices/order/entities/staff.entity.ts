import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { IStaff } from '../interfaces/staff.interface';

@Schema({ collection: 'Staff', timestamps: true })
export class Staff extends Model<IStaff> {
	@Prop()
	staffName: String;
	@Prop()
	locationId: String;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
