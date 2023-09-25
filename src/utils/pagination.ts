import { Model } from 'mongoose';

export const pagination = (data: any, page: number = 1, perPage: number = 10) => {
	const startIndex = (+page - 1) * +perPage;
	const endIndex = +startIndex + +perPage;

	const paginatedData = data.slice(startIndex, endIndex);

	return {
		totalCount: data.length,
		currentPage: page as number,
		perPage: perPage as number,
		totalPages: Math.ceil(data.length / perPage),
		data: paginatedData,
	};
};

export const paginateWithNextHit = async (model: Model<any>, aggPipe: any, limit: number, page: number) => {
	if (limit) {
		limit = Math.abs(limit);
		if (limit > 100) {
			limit = 100;
		}
	} else {
		limit = 10;
	}
	if (page && page !== 0) {
		page = Math.abs(page);
	} else {
		page = 1;
	}
	const skip = limit * (page - 1);

	aggPipe.push({
		$facet: {
			data: [{ $skip: skip }, { $limit: limit }],
			metadata: [{ $count: 'total' }, { $addFields: { page } }],
		},
	});
	const result = await model.aggregate(aggPipe);
	/* tslint:disable:no-string-literal */
	let next_hit = false;
	const total_page = result[0].data.length > 0 ? Math.ceil(result[0].metadata[0].total / limit) : 0;
	if (result[0]['data'].length > limit) {
		result[0]['data'].pop();
	}

	if (total_page > page) {
		next_hit = true;
	}

	return {
		count: result[0]['metadata'] && result[0]['metadata'][0] ? result[0]['metadata'][0]['total'] : 0,
		page: result[0]['metadata'] && result[0]['metadata'][0] ? result[0]['metadata'][0]['page'] : page,
		totalPage: total_page,
		hasNextPage: next_hit,
		limit,
		data: result[0]['data'],
	};
};
