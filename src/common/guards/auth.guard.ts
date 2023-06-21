import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_TYPE } from 'src/microservices/user';
import { JwtService } from '../../utils/token.util';
import { RedisService } from 'src/config/cache/config.service';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly jwtService: JwtService,
		private readonly redisService: RedisService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<USER_TYPE[]>('roles', [context.getHandler(), context.getClass()]);
		if (!requiredRoles) return true;

		const request = context.switchToHttp().getRequest();
		const bearerToken = request.headers.authorization;
		if (!bearerToken || !bearerToken.startsWith('Bearer ')) return false;

		const token = bearerToken.split(' ')[1];
		try {
			const decoded = this.jwtService.verifyAccessToken(token);
			// @ts-ignore
			const userRole = decoded.userType;

			if (requiredRoles.includes(userRole)) {
				request.user = decoded;
				// @ts-ignore
				const userId = decoded.id;
				const loggedIn = await this.redisService.getValue(userId);
				if (!loggedIn) {
					return false;
				}
				return true;
			}

			return false;
		} catch (error) {
			return false;
		}
	}
}
