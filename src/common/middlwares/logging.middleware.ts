import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';

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
		winston.format.colorize({ all: true }),
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		winston.format.printf(({ level, timestamp, message }) => {
			return `${timestamp} [${level}] - ${message}`;
		})
	),
	transports: [new winston.transports.Console()],
});

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		res.on('finish', () => {
			const { method, originalUrl, body } = req;
			const { statusCode } = res;
			const logMessage = `Method: ${method} | URL: ${originalUrl} | Body: ${JSON.stringify(body)} | Status: ${statusCode}`;
			logger.info(logMessage);
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
