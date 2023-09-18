import { Types } from "mongoose";

export interface IAction {
	name: string;
	isActive: boolean;
	isDeleted: boolean;
	isTrackable?: boolean;
	graphId?:Types.ObjectId
}
