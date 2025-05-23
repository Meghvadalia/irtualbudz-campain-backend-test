import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
	private readonly accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
	private readonly accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
	private readonly refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
	private readonly refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;

	generateAccessToken(payload: any): string {
		try {
			return jwt.sign(payload, this.accessTokenSecret, {
				expiresIn: this.accessTokenExpiry,
			});
		} catch (error) {
			throw new Error('Error generating token.');
		}
	}

	generateRefreshToken = (payload: object): string => {
		try {
			const token = jwt.sign(payload, this.refreshTokenSecret, {
				expiresIn: this.refreshTokenExpiry as string,
			});
			return token;
		} catch (error) {
			throw new Error(error.message);
		}
	};

	/**
	 * Verifies the authenticity and validity of an access token.
	 * @param token The access token to be verified.
	 * @returns The decoded token payload if the token is valid.
	 * @throws Error if the token has expired or if there was an error verifying the access token.
	 */
	verifyAccessToken = (token: string): string | jwt.JwtPayload | any => {
		try {
			const isTokenValid = jwt.verify(token, this.accessTokenSecret);
			return isTokenValid;
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				throw new Error('Access token has expired.');
			} else {
				throw new Error('Error verifying access token.');
			}
		}
	};

	/**
	 * Verify the authenticity and validity of a refresh token.
	 * @param token - The refresh token to be verified.
	 * @returns The decoded token payload if the refresh token is valid.
	 * @throws An error if the refresh token is invalid or has expired.
	 */
	verifyRefreshToken = (token: string): string | jwt.JwtPayload | any => {
		try {
			return jwt.verify(token, this.refreshTokenSecret);
		} catch (error) {
			throw new Error(error);
		}
	};
}
