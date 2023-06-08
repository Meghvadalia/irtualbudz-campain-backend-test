import { IStore } from './../interface/store.inteface';
import { IAddress, IhoursOfOperation } from 'src/common/interface';
import { ILocation } from './../../../common/interface/index';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company } from 'src/model/company/entities/company.entity';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.STORES })
export class Store extends Model<IStore> {
	@Prop({ required: true, type: Object })
	location: ILocation;

	@Prop({
		type: Types.ObjectId,
		ref: DATABASE_COLLECTION.COMPANIES,
		required: true,
	})
	companyId: Types.ObjectId;

	@Prop({
		type: [
			{
				day: { type: String, required: true },
				openTime: { type: String, required: true },
				closeTime: { type: String, required: true },
			},
		],
	})
	hoursOfOperation: IhoursOfOperation[];

	@Prop({ required: true })
	timeZone: string;

	address: IAddress;

	phonenumber: string;

	email: string;

	licenseType: string[];

	@Prop({ default: Date.now })
	updatedAt: Date;

	@Prop({ default: false })
	isDeleted: boolean;

	@Prop({ default: true })
	isActive: boolean;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
