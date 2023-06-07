import { Document } from 'mongoose';

export interface IPOS {
	name: string;
	liveUrl: string;
	stagingUrl: string;
	documentationUrl: string;
	
}
