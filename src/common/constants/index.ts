export const DATABASE_REPOSITORY = {
	USER_REPOSITORY: 'USER_REPOSITORY',
};

export const DATABASE_COLLECTION = {
	POS: 'POS',
	COMPANIES: 'companies',
	STORES: 'stores',
	CUSTOMER: 'customers',
	ORDER: 'orders',
	INVENTORY: 'inventories',
	PRODUCT: 'products',
	CART: 'cart',
	STAFF: 'staff',
	USER: 'users',
	SESSION: 'session',
};

export const enum PERMISSIONS_FOR_DATABASE {
	CREATE = 'create',
	READ = 'read',
	UPDATE = 'update',
	DELETE = 'delete',
	MANAGE = 'manage',
	ALL = 'all',
}
