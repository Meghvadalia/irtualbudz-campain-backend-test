import { BadRequestException, Body, Controller, HttpCode, OnModuleInit, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { join } from 'path';
import { Request, Response } from 'express';
import { CreateUserDto, Login } from 'src/microservices/user/dto/user.dto';
import { Roles, RolesGuard } from 'src/common/guards/auth.guard';
import { USER_TYPE } from 'src/microservices/user';
import { sendSuccess } from 'src/utils/request-response.utils';

interface IUserService {
	Signup(data: any): Observable<any>;
	Login(data: any): Observable<any>;
	Logout(data: any): Observable<any>;
	AccessToken(data: any): Observable<any>;
}

@Controller('user')
export class ClientUserController implements OnModuleInit {
	private userService: IUserService;
	private client: ClientGrpc;
	constructor() {}

	onModuleInit() {
		this.client = ClientProxyFactory.create({
			transport: Transport.GRPC,
			options: {
				package: 'user',
				protoPath: join(__dirname, '../../../proto/user.proto'),
				url: 'localhost:8002',
			},
		});
		this.userService = this.client.getService<IUserService>('UserService');
	}

	@Post('register')
	@HttpCode(201)
	async register(@Body() userData: CreateUserDto): Promise<any> {
		try {
			const user = await firstValueFrom(this.userService.Signup(userData));
			return sendSuccess(user);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Post('login')
	@HttpCode(200)
	async login(@Body() loginData: Login): Promise<any> {
		try {
			const user = await firstValueFrom(this.userService.Login(loginData));

			return sendSuccess(user, 'Log-in successful.');
		} catch (error) {
			throw new Error('Login failed');
		}
	}

	@Post('logout')
	@UseGuards(RolesGuard)
	@Roles(USER_TYPE.ADMIN)
	@HttpCode(200)
	async logout(@Req() req: Request): Promise<any> {
		try {
			// @ts-ignore
			const user = req.user;
			const request = { userId: user.id, sessionId: user.sessionId };
			const response = await firstValueFrom(this.userService.Logout(request));
			return sendSuccess(null, 'Logged out successfully.');
		} catch (error) {
			throw new Error('Error logging out.');
		}
	}

	@Post('refresh_token')
	@HttpCode(200)
	async refreshToken(@Body() body: { refreshToken: string }, @Res() res: Response): Promise<any> {
		try {
			const request = { refreshToken: body.refreshToken };
			const token = await firstValueFrom(this.userService.AccessToken(request));
			return res.json(token);
		} catch (error) {
			throw new Error('Error refreshing access token.');
		}
	}
}
