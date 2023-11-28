import { IStore } from './../interface/store.inteface';
import { IAddress, IhoursOfOperation } from 'src/common/interface';
import { ILocation } from './../../../common/interface/index';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';

@Schema({ collection: DATABASE_COLLECTION.STORES, timestamps: true })
export class Store extends Model<IStore> {
	@Prop({ required: true, type: Object })
	location: ILocation;

	@Prop()
	locationName: string;

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

	@Prop()
	timeZone: string;

	@Prop({ type: mongoose.Schema.Types.Array })
	address: IAddress;

	@Prop()
	phonenumber: string;

	@Prop()
	website: string;

	@Prop()
	email: string;

	@Prop()
	licenseType: string[];

	@Prop({ default: false })
	isDeleted: boolean;

	@Prop({ default: true })
	isActive: boolean;

	@Prop({ type: Number })
	brandId: number;

	@Prop({ default: null })
	storeDesc: string;

	@Prop({ type: Number })
	sendyUserId: number;

	@Prop({ type: [String] })
	logos: string[];

	@Prop({ default: null })
	storeLink: string;

	@Prop({ default: null })
	facebook: string;

	@Prop({ default: null })
	instagram: string;

	@Prop({ default: null })
	linkedIn: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
