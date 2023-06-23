import { ObjectType } from '@nestjs/graphql';

import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ICompany } from '../interface/company.interface';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { IFlowhubHeaderInterface } from 'src/common/interface';

@Schema({
	collection: DATABASE_COLLECTION.COMPANIES,
	timestamps: true,
})
@ObjectType()
export class Company extends Model<ICompany> {
	@Prop({ trim: true, required: true })
	name: string;

	@Prop({
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.POS,
		required: true,
	})
	posId: Types.ObjectId;

	@Prop()
	totalStore: number;

	@Prop({ type: Object })
	dataObject: IFlowhubHeaderInterface;

	@Prop({ default: Date.now })
	updatedAt: Date;

	@Prop({ default: false })
	isDeleted: boolean;

	@Prop({ default: true })
	isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
