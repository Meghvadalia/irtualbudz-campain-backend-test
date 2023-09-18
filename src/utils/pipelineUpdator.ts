import { PipelineStage } from 'mongoose';

export const updatePipeline = (pipeline: PipelineStage[], key: string, newValue: any) => {
	for (const stage of pipeline) {
		for (const stageKey in stage) {
			// (stage[key] === '' || stage[key] === undefined)
			if (stageKey === key && newValue !== '' && newValue !== undefined) {
				stage[stageKey] = newValue;
			} else if (stageKey == '$or' && typeof stage[stageKey] == typeof newValue) {
				stage[stageKey] = newValue;
			} else if (typeof stage[stageKey] === 'object' && stageKey != '$or') {
				updatePipeline([stage[stageKey]], key, newValue);
			}
		}
	}
};
