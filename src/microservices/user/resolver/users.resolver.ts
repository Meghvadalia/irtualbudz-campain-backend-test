import { UsersService } from '../service/users.service';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { UserDto } from '../dto/user.dto';

@Resolver(() => User)
export class UsersResolver {
	constructor(private readonly usersService: UsersService) {}

	@Mutation(() => User)
	createUser(@Args('createUserInput') createUserInput: UserDto) {}

	@Query(() => [User], { name: 'users' })
	findAll() {}

	@Query(() => User, { name: 'user' })
	findOne(@Args('id', { type: () => Int }) id: number) {}

	@Mutation(() => User)
	updateUser(@Args('id', { type: () => Int }) id: number, @Args('updateUserInput') updateUserInput: UserDto) {}

	@Mutation(() => User)
	removeUser(@Args('userId', { type: () => Int }) userId: number) {}
}
