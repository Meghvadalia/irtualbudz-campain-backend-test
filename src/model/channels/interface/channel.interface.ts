export interface IChannel {
	name: ChannelTypes;
	isActive: boolean;
	isDeleted: boolean;
}

export const Channels = {
	// NEWS_LETTER: 'News-Letters',
	Email: 'Email',
	SMS: 'SMS',
	Screens: 'Screens',
	ONLINE_ORDERING_PLATFORM: 'Online Ordering Platform',
	SOCIAL: 'Social',
	PRINT: 'Print',
	IN_STORE_POSTERS: 'In-Store Posters',
} as const;

export type ChannelTypes = (typeof Channels)[keyof typeof Channels];
