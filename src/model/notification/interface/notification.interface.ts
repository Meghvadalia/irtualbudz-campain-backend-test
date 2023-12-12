export interface INOTIFICATION {
	_id: string;
	userId: string;
	storeId: string;
	title: string;
	message: string;
	isRead: boolean;
	isDeleted: boolean;
	createdAt?: Date;
	notificationData?: object;
	notificationType: NotificationType;
}

export enum NotificationType {
	NewAsset = 'New Assets',
	Expiring = 'Expiring products',
	Halloween = 'Halloween',
	SlowMoving = 'Slow Moving Items',
    Thanks_Giving = 'Thanks_Giving',
	CHRISTMAS_SEASON='Christmas Season'
}
