import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BasicAuthDopeCastMiddleware implements NestMiddleware {
	private readonly validUsername = process.env.BASIC_AUTH_DOPECAST_USERNAME;
	private readonly validPassword = process.env.BASIC_AUTH_DOPECAST_PASSWORD;

	constructor() {}

	use(req: Request, res: Response, next: NextFunction) {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Basic ')) {
			throw new UnauthorizedException('Missing or invalid credentials');
		}

		const base64Credentials = authHeader.split(' ')[1];
		const credentials = Buffer.from(base64Credentials, 'base64').toString();

		const [username, password] = credentials.split(':');
		if (username === this.validUsername && password === this.validPassword) {
			next();
		} else {
			// next();
			throw new UnauthorizedException('Invalid username or password');
		}
	}
}
