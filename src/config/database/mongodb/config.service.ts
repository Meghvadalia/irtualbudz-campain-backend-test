import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MongodbConfigService {
	constructor(private configService: ConfigService) {}

	get protocol(): string {
		return this.configService.get<string>('mongodb.protocol') as string;
	}

	get host(): string {
		return this.configService.get<string>('mongodb.host') as string;
	}

	get port(): number {
		return Number(this.configService.get<number>('mongodb.port')) as number;
	}

	get database(): string {
		return this.configService.get<string>('mongodb.database') as string;
	}
	get userName(): string {
		return this.configService.get<string>('mongodb.userName') as string;
	}

	get password(): string {
		return this.configService.get<string>('mongodb.password') as string;
	}
	shouldAuthenticate(): boolean {
		const nodeEnv = this.configService.get<string>('NODE_ENV');
		return nodeEnv === 'production' || nodeEnv === 'staging';
	}
}
