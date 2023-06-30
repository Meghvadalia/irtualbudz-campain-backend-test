import { ObjectType } from '@nestjs/graphql';
import { CustomerType, ICustomer } from '../interfaces/customer.interface';
import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({
	collection: DATABASE_COLLECTION.CUSTOMER,
	timestamps: true,
})
@ObjectType()
export class Customer extends Model<ICustomer> {
	@Prop({ unique: true })
	posCustomerId: string;

	@Prop({
		required: true,
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.COMPANIES,
	})
	companyId: string;

	@Prop({ required: true, type: Types.ObjectId, ref: DATABASE_COLLECTION.POS })
	POSId: string;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.STORES })
	storeId: string;

	@Prop({ enum: CustomerType })
	type: string;

	@Prop()
	name: string;

	@Prop()
	state: string;

	@Prop()
	birthDate: Date;

	@Prop()
	isLoyal: boolean;

	@Prop()
	loyaltyPoints: number;

	@Prop()
	email: string;

	@Prop()
	phone: string;

	@Prop()
	streetAddress1: string;

	@Prop()
	streetAddress2: string;

	@Prop()
	city: string;

	@Prop()
	zip: string;

	@Prop()
	country: string;

	@Prop({ default: false })
	isDeleted: boolean;

	@Prop({ default: true })
	isActive: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
