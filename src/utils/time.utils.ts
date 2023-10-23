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
