import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '../../utils/token.util';
import { RedisService } from 'src/config/cache/config.service';
import { USER_TYPE, USER_TYPE_ORDER } from 'src/microservices/user/constants/user.constant';

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
				const requestingUserRoleOrder = USER_TYPE_ORDER[userRole];
				const requiredRolesOrder = requiredRoles.map((role) => USER_TYPE_ORDER[role]);

				const isAllowed = requiredRolesOrder.every((roleOrder) => roleOrder > requestingUserRoleOrder);

				if (isAllowed) {
					request.user = decoded;
					// @ts-ignore
					const userId = decoded.userId;
					const loggedIn = await this.redisService.getValue(userId);
					if (!loggedIn) return false;
					return true;
				}
			}

			return false;
		} catch (error) {
			console.trace(error);
			return false;
		}
	}
}
