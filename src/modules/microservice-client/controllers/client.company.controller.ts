import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClientCompanyService } from '../services/client.company.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';

@Controller('company')
export class ClientCompanyController {
	constructor(private readonly clientcompanyService: ClientCompanyService) {}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN)
	async companies() {
		try {
			return await this.clientcompanyService.companyList();
		} catch (error) {
			throw new Error(error);
		}
	}
}
