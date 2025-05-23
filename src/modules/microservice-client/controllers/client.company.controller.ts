import { BadRequestException, Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ClientCompanyService } from '../services/client.company.service';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';
import { Request } from 'express';
import { sendError } from 'src/utils/request-response.utils';

@Controller('company')
export class ClientCompanyController {
	constructor(private readonly clientcompanyService: ClientCompanyService) {}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN)
	async companies(@Req() req: Request) {
		try {
			return await this.clientcompanyService.companyList(req);
		} catch (error) {
			// throw new BadRequestException(error.details);
			return sendError(error.message, error.status);
		}
	}
}
