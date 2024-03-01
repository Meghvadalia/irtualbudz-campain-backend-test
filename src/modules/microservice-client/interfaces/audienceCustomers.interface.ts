import { Types } from 'mongoose';

export interface IAudienceCustomer {
	_id?: Types.ObjectId;
	audienceId: Types.ObjectId;
	customerId: Types.ObjectId;
	storeId: Types.ObjectId;
	isActive?: boolean;
	isDeleted?: boolean;
	isArchive?: boolean;
	type: AudienceCustomerType;
}

export enum AudienceCustomerType {
	SYSTEM = 'System',
	USER = 'User',
}
