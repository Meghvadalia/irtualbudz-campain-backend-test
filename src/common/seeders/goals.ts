import { GOALSTYPES, IGOALS } from 'src/model/goals/interface/goals.interface';

export const goalsData: IGOALS[] = [
	{
		name: GOALSTYPES.IncreaseMargins,
		isDeleted: false,
		isActive: true,
		isTrackable: true,
	},
	{
		name: GOALSTYPES.IncreaseInStoreTraffic,
		isDeleted: false,
		isActive: true,
		isTrackable: true,
	},
	{
		name: GOALSTYPES.IncreaseCartSize,
		isDeleted: false,
		isActive: true,
		isTrackable: true,
	},
	{
		name: GOALSTYPES.IncreaseOnlineOrders,
		isDeleted: false,
		isActive: true,
		isTrackable: true,
	},
	{
		name: GOALSTYPES.Custom,
		isDeleted: false,
		isActive: false,
		isTrackable: false,
	},
];
