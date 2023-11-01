import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
	private readonly validUsername = process.env.BASIC_AUTH_USERNAME;
	private readonly validPassword = process.env.BASIC_AUTH_PASSWORD;

	constructor() {}

	use(req: Request, res: Response, next: NextFunction) {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Basic ')) {
			throw new UnauthorizedException('Missing or invalid credentials');
		}

		const base64Credentials = authHeader.split(' ')[1];
		const credentials = Buffer.from(base64Credentials, 'base64').toString();
		
		const [username, password] = credentials.split(':');
		console.log(this.validUsername);
		console.log(typeof this.validUsername);
		console.log(this.validPassword);
		console.log(typeof this.validPassword);
		console.log(process.env.NODE_ENV);
		if (username === this.validUsername && password === this.validPassword) {
			next();
		} else {
			// next();
			throw new UnauthorizedException('Invalid username or password');
		}
	}
}
