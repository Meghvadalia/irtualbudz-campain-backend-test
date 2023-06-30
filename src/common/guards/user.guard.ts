// create-user.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Ability } from '@casl/ability';
import { defineAbilitiesForUserCreation } from '../accesscontrol/user-ability.rules';

@Injectable()
export class CreateUserGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		try {
			const request = context.switchToHttp().getRequest();
			const user = request.user; // Assuming user information is available in the request

			const ability = defineAbilitiesForUserCreation(user);

			// Check if the user has permission to create the requested role
			console.log('can ', ability.can('create', request.body.type));
			return ability.can('create', request.body.type);
		} catch (error) {
			console.log(error);
			throw new Error(error);
		}
	}
}
