import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
	private logger = new Logger('Request');

	use(req: Request, res: Response, next: NextFunction) {
		res.on('finish', () => {
			const { method, originalUrl, body, statusCode } = req;
			const logMessage = `Method: ${method} | URL: ${originalUrl} | Body: ${JSON.stringify(body)} | Status: ${statusCode}`;
			this.logger.log(logMessage);
		});

		next();
	}
}
