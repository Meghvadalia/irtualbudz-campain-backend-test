import { Controller, Get, UseGuards } from '@nestjs/common';
import { AudienceDetailsService } from '../services/client.audienceDetail.service';
import { sendError, sendSuccess } from 'src/utils/request-response.utils';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user/constants/user.constant';

@Controller('audience_details')
export class AudienceDetailsController {
	constructor(private readonly audienceDetailsService: AudienceDetailsService) {}

	@Get('list')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.SUPER_ADMIN, USER_TYPE.ADMIN, USER_TYPE.COMPANY_ADMIN, USER_TYPE.STORE_ADMIN)
	async getAudienceDetailsList() {
		try {
			const audienceDetailsList = await this.audienceDetailsService.getAllAudiences();
			return sendSuccess(audienceDetailsList);
		} catch (error) {
			return sendError(error.message, error.status);
		}
	}
}
