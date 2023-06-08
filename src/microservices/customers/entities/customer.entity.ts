import { ObjectType } from '@nestjs/graphql';
import { CustomerType, ICustomer } from '../interfaces/customer.interface';
import { Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
	collection: 'Customer',
	timestamps: true,
})
@ObjectType()
export class Customer extends Model<ICustomer> {
	@Prop()
	id: string;

	@Prop()
	companyId: string;

	@Prop()
	POSId: string;

	@Prop()
	storeId: string;

	@Prop({ enum: CustomerType })
	type: string;

	@Prop()
	name: string;

	@Prop()
	state: string;

	@Prop()
	birthDate: string;

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
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
