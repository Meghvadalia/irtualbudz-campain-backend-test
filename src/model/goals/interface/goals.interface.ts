export interface IGOALS {
	_id?: string;
	name: GOALSTYPES;
	isDeleted?: boolean;
	isActive?: boolean;
	graphId?: string;
	isTrackable?: boolean;
}

export enum GOALSTYPES {
	IncreaseInStoreTraffic = 'Increase In-store traffic',
	IncreaseCartSize = 'Increase Cart Size',
	IncreaseOnlineOrders = 'Increase Online Orders',
	Custom = 'custom',
}
