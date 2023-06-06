import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
class JwtService {
  generateAccessToken(payload: any): string {
    try {
      return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      });
    } catch (error) {
      throw new Error('Error generating token.');
    }
  }

  generateRefreshToken = (payload: object): string => {
    try {
      const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY as string,
      });
      return token;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  verifyAccessToken = (token: string): string | jwt.JwtPayload => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
  };

  verifyRefreshToken = (token: string): string | jwt.JwtPayload => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_EXPIRY!);
  };
}

export const jwtService = new JwtService();
