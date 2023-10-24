import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';
const newrelicFormatter = require('@newrelic/winston-enricher');

const newrelicWinstonFormatter = newrelicFormatter(winston);

export enum CombinedLogger {
	EMERG = 'emerg',
	ALERT = 'alert',
	CRIT = 'crit',
	ERROR = 'error',
	WARNING = 'warning',
	NOTICE = 'notice',
	INFO = 'info',
	DEBUG = 'debug',
}

const logger = winston.createLogger({
	format: winston.format.combine(
		newrelicWinstonFormatter(),
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		winston.format.printf(({ level, timestamp, message }) => {
			return `${timestamp} [${level}] - ${message}`;
		})
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize({ all: true }),
				winston.format.printf(({ level, message }) => {
					return `[${level}] - ${message}`;
				})
			),
		}),
	],
});

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const { method, originalUrl, body } = req;
		const startTime = Date.now();

		res.on('finish', () => {
			const { statusCode } = res;
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			const logMessage = `Method: ${method} | URL: ${originalUrl} | Body: ${JSON.stringify(
				body
			)} | Status: ${statusCode} | Response Time: ${responseTime}ms`;
			logger.info(logMessage);
		});

		res.on('error', (error) => {
			logger.error(`Error: ${error.message}`);
		});

		next();
	}
}

export function combineLog(level: CombinedLogger, message: any) {
	if (typeof message == 'object') {
		message = JSON.stringify(message);
	}
	logger[level](message);
}

export function customLogger(args: any) {
	combineLog(CombinedLogger.INFO, args);
}

export function customErrorLogger(args: any) {
	combineLog(CombinedLogger.ERROR, args);
}
