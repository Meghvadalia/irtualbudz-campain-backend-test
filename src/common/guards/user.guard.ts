import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { defineAbilitiesForUserCreation } from '../accesscontrol/user-ability.rules';
import { PERMISSIONS_FOR_DATABASE } from '../constants';

@Injectable()
export class CreateUserGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		try {
			const request = context.switchToHttp().getRequest();
			const user = request.user;

			const ability = defineAbilitiesForUserCreation(user);

			return ability.can(PERMISSIONS_FOR_DATABASE.CREATE, request.body.type);
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
}
