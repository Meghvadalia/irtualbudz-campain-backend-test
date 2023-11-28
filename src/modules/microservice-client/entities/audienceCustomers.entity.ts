import { Model, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DATABASE_COLLECTION } from 'src/common/constants';
import { AudienceCustomerType, IAudienceCustomer } from '../interfaces/audienceCustomers.interface';

@Schema({
	collection: DATABASE_COLLECTION.AUDIENCE_CUSTOMERS,
	timestamps: true,
})
export class AudienceCustomer extends Model<IAudienceCustomer> {
	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.AUDIENCE_DETAIL })
		audienceId: string;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.CAMPAIGN })
		campaignId: string;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.CUSTOMER })
		customerId: string;

	@Prop({ type: Types.ObjectId, ref: DATABASE_COLLECTION.STORES })
		storeId: string;

	@Prop({ default: AudienceCustomerType.SYSTEM })
		type: AudienceCustomerType;

	@Prop({ default: true })
		isActive: boolean;

	@Prop({ default: false })
		isDeleted: boolean;

	@Prop({ default: false })
		isArchive: boolean;
}

export const AudienceCustomerSchema = SchemaFactory.createForClass(AudienceCustomer);
AudienceCustomerSchema.index(
	{ audienceId: 1, customerId: 1, storeId: 1, campaignId: 1 },
);
AudienceCustomerSchema.index(
	{ audienceId: 1, customerId: 1, storeId: 1, type: 1 },
);
