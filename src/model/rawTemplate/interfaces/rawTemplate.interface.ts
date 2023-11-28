export interface IRawTemplate {
	content: string;
	isActive: boolean;
	isDeleted: boolean;
	itemCount: number;
	replacements: string[];
	image: string;
	[property: string]: any;
}
