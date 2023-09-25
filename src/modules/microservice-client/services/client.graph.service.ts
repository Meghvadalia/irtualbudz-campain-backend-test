import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IGraph } from 'src/model/graph/interface/graph.interface';
import { Graph } from 'src/model/graph/entities/graph.entity';
import { graphData } from 'src/common/seeders/graph';
import { dynamicCatchException, throwNotFoundException } from 'src/utils/error.utils';

@Injectable()
export class ClientGraphService {
	constructor(@InjectModel(Graph.name) private readonly graphModel: Model<Graph>) {}
	async graphById(id: string): Promise<any> {
		try {
			const graph = await this.graphModel.findById(id);
			if (!graph) throwNotFoundException('Graph not found.');
			return graph;
		} catch (error) {
			dynamicCatchException(error);
		}
	}

	async updateGraphByName() {
		try {
			console.log('Total ' + graphData.length + ' graph updates');
			for (let index = 0; index < graphData.length; index++) {
				const element = graphData[index];
				await this.graphModel.updateOne({ name: element.name }, { condition: element.condition }, { axes: element.axes });
				console.log(element.name + ' Updated');
			}
		} catch (error) {
			console.error('Failed to update graph data: ' + error.message);
			dynamicCatchException(error);
		}
	}
}
