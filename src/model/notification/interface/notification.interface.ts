export interface INOTIFICATION {
	_id: string;
    userId: string;
    storeId: string;
    title: string;
    message: string;
    isRead: boolean;
    isDeleted: boolean;
    createdAt?:Date;
}