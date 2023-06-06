import { BadRequestException, Body, Controller, HttpCode, OnModuleInit, Post, Res } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { join } from 'path';
import { Response } from 'express';
import { CreateUserDto, Login } from 'src/microservices/user/dto/user.dto';

interface IUserService {
	Signup(data: any): Observable<any>;
	Login(data: any): Observable<any>;
}

@Controller('user')
export class UserController implements OnModuleInit {
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
			return user;
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Post('login')
	@HttpCode(200)
	async login(@Body() loginData: Login, @Res({ passthrough: true }) res: Response): Promise<any> {
		try {
			const user = await firstValueFrom(this.userService.Login(loginData));
			console.log({ user });

			res.cookie('refreshToken', user.refreshToken, {
				httpOnly: true,
				sameSite: true,
				secure: true,
			});
			delete user.refreshToken;

			return res.json({ message: 'Login successful.', user });
		} catch (error) {
			throw new Error('Login failed');
		}
	}
}
