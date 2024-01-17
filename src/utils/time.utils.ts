import * as moment from 'moment-timezone';
import { DATE_FORMAT } from 'src/common/constants';

export function getStoreTimezoneDateRange(fromDate: string, toDate: string, userTimezone: string) {
	const fromUtc = moment
		.tz(fromDate, DATE_FORMAT.MM_DD_YYYY, userTimezone)
		.startOf('day')
		.utc()
		.format();
	const toUtc = moment.tz(toDate, DATE_FORMAT.MM_DD_YYYY, userTimezone).endOf('day').utc().format();

	return {
		formattedFromDate: new Date(fromUtc),
		formattedToDate: new Date(toUtc),
	};
}

export function getCurrentYearDateRange(userTimezone: string) {
	const fromUtc = moment().tz(userTimezone).startOf('year').format();

	const toUtc = moment().tz(userTimezone).endOf('year').format();
	return {
		formattedFromDate: new Date(fromUtc),
		formattedToDate: new Date(toUtc),
	};
}

export function calculateUtcOffset(timezone: string): number {
	const now = moment();
	const localMoment = now.clone().tz(timezone);

	// Calculate the UTC offset directly
	const utcOffsetMinutes = localMoment.utcOffset();

	return utcOffsetMinutes;
}

// calculate the delay based on the server Time

export function calculateDelay(storeTimeZone: string): number {
	const now = moment().tz('America/New_York');

	// Convert to the store timezone
	const nowInStoreTimeZone = now.clone().tz(storeTimeZone);

	// Calculate milliseconds until midnight in the store timezone
	const midnight = nowInStoreTimeZone.clone().endOf('day');
	const delayMilliseconds = midnight.diff(nowInStoreTimeZone);
	return delayMilliseconds;
}

export async function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
