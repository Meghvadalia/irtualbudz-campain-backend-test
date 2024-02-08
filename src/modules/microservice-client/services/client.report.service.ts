import { Injectable } from '@nestjs/common';
import { ClientCustomerService } from './client.customer.service';
import { ClientOrderService } from './client.order.service';
import { Types } from 'mongoose';
import { ClientStoreService } from './client.store.service';
import { getStoreTimezoneDateRange } from 'src/utils/time.utils';
import { RpcException } from '@nestjs/microservices';
import axios from 'axios';

@Injectable()
export class ClientReportService {
	constructor() {}

	async getAllReportData(campaignId?: string) {
		if (!campaignId) {
			throw new RpcException('campaignId not found');
		}
		return new Promise((resolve, reject) => {
			let funcionsArry = [
				this.getPieChart(campaignId),
				this.getBarChart(campaignId),
				this.getLinkActivity(campaignId),
				this.getLastOpened(campaignId),
				this.getUnsubscribed(campaignId),
				this.getLastBounced(campaignId),
				this.getLastMarkedAsSpam(campaignId),
				this.getAllCountries(campaignId),
				this.getSummaryData(campaignId),
			];
			return Promise.all(funcionsArry).then((values) => {
				return resolve(values);
			});
		});
	}

	getPieChart(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'getPieChart')
				.then((res) => {
					console.log('res', res);
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}

	getBarChart(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'getBarChart')
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}

	getLinkActivity(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'linkActivity')
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}
	getLastOpened(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'lastOpened')
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}
	getAllCountries(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'allCountries')
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}

	getUnsubscribed(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'unsubscribed')
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}

	getLastBounced(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'lastBounced')
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}
	getLastMarkedAsSpam(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'lastMarkedAsSpam')
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}

	getSummaryData(campaignId?: string) {
		return new Promise((resolve, reject) => {
			this.apiCall(campaignId, 'getSummary')
				.then((res) => {
					console.log('res', res);
					return resolve(res);
				})
				.catch((err) => {
					return reject(err);
				});
		});
	}

	apiCall(campaignId?: string, url?: string) {
		return new Promise((resolve, reject) => {
			const options = {
				method: 'get',
				url: `${process.env.TRACKING_SERVER}/report/${url}`,
				data: JSON.stringify({
					campaignId: campaignId,
				}),
				headers: {
					'Content-Type': 'application/json',
					Authorization:
						'Basic ' +
						btoa(
							`${process.env.TRACKING_AUTH_USERNAME}:${process.env.TRACKING_AUTH_PASSWORD}`
						).toString(),
				},
			};
			try {
				return axios
					.request(options)
					.then((response) => {
						return resolve({ [url]: response.data.data });
					})
					.catch((error) => {
						reject(error);
					});
			} catch (error) {
				reject(error);
			}
		});
	}

	getTrackingCampaign(brandId) {
		return new Promise((resolve, reject) => {
			let data = JSON.stringify({
				brandId: brandId,
			});

			let config = {
				method: 'get',
				maxBodyLength: Infinity,
				url: `${process.env.TRACKING_SERVER}/campaign/getCampaign`,
				headers: {
					'Content-Type': 'application/json',
					Authorization:
						'Basic ' +
						btoa(
							`${process.env.TRACKING_AUTH_USERNAME}:${process.env.TRACKING_AUTH_PASSWORD}`
						).toString(),
				},
				data: data,
			};

			return axios
				.request(config)
				.then((response) => {
					return resolve(response.data.data);
				})
				.catch((error) => {
					console.log(error);
				});
		});
	}
}
