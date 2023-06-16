import { Schema } from 'mongoose';

export interface ISession {
	userId: Schema.Types.ObjectId;
	type: string;
}
