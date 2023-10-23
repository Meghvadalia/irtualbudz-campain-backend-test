export interface IGraph {
	_id?: string;
	name: string;
	condition: Array<object>;
	axes?: iAxes[];
	isTrackable?: boolean;
}

export interface iAxes {
	xAxis: Array<string>;
	yAxis: Array<string>;
}
