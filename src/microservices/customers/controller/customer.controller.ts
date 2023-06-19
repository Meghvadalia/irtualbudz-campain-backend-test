import { Controller, Get, SerializeOptions } from '@nestjs/common';

import { CustomerService, extendedUserGroupsForSerializing } from '../index';

@Controller('customer')
@SerializeOptions({
	groups: extendedUserGroupsForSerializing,
})
export class CustomerController {
	constructor(private readonly customerService: CustomerService) {}
}
