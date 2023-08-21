import { BaseInterface } from "src/common/interface";

export interface IStaff extends BaseInterface {
	staffName: string;
	storeId: string;
	posIdCode?:string
}
