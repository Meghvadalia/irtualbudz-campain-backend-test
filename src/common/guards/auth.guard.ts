import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { USER_TYPE } from 'src/microservices/user';
import { JwtService } from '../../utils/token.util';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
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
			console.log(requiredRoles.includes(userRole));

			if (requiredRoles.includes(userRole)) {
				request.user = decoded;
				return true;
			}

			return false;
		} catch (error) {
			return false;
		}
	}
}
