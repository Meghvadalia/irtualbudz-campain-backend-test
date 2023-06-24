import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '../../utils/token.util';
import { RedisService } from 'src/config/cache/config.service';
import { defineAbilitiesFor } from '../utils/appAbility';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly jwtService: JwtService,
		private readonly redisService: RedisService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [context.getHandler(), context.getClass()]);

		const request = context.switchToHttp().getRequest();
		const bearerToken = request.headers.authorization;
		if (!bearerToken || !bearerToken.startsWith('Bearer ')) return false;

		const token = bearerToken.split(' ')[1];
		try {
			const decoded = this.jwtService.verifyAccessToken(token);
			// @ts-ignore
			const userRole = decoded.userType;

			request.user = decoded;

			const user = { role: userRole };
			const abilities = defineAbilitiesFor(user);

			const canAccess = requiredRoles.some((role) => abilities.can(role, 'any'));

			if (!canAccess) return false;

			// @ts-ignore
			const userId = decoded.userId;
			const loggedIn = await this.redisService.getValue(userId);
			if (!loggedIn) return false;

			return true;
		} catch (error) {
			return false;
		}
	}
}
