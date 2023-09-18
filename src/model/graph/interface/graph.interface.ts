export interface IGraph {
	_id?: string;
	name: string;
	condition: Array<Object>;
	axes?: iAxes[];
	isTrackable?: boolean;
}

export interface iAxes {
	xAxis: Array<string>;
	yAxis: Array<string>;
}
