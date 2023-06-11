import { CustomerService } from '../customer.service';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Customer } from '../entities/customer.entity';
// import { UserDto } from '../dto/customer.dto';

// @Resolver(() => Customer)
// export class UsersResolver {
// 	constructor(private readonly customerService: CustomerService) {}

// 	@Mutation(() => Customer)
// 	createUser(@Args('createUserInput') createUserInput: UserDto) {}

// 	@Query(() => [Customer], { name: 'users' })
// 	findAll() {}

// 	@Query(() => Customer, { name: 'user' })
// 	findOne(@Args('id', { type: () => Int }) id: number) {}

// 	@Mutation(() => Customer)
// 	updateUser(@Args('id', { type: () => Int }) id: number, @Args('updateUserInput') updateUserInput: UserDto) {}

// 	@Mutation(() => Customer)
// 	removeUser(@Args('userId', { type: () => Int }) userId: number) {}
// }
