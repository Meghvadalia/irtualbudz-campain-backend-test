import { Schema } from 'mongoose';

export interface ISession {
	userId: string;
	type: string;
}
