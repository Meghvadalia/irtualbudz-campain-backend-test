import { IFlowhubHeaderInterface, BaseInterface } from 'src/common/interface';

export interface ICompany extends BaseInterface {
	name: string;
	posId: string;
	totalStore: number;
	dataObject: IFlowhubHeaderInterface;
	lastSyncDataDuration: number;
}
