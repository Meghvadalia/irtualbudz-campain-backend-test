import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get env(): string {
    return this.configService.get<string>('app.env') as string;
  }

  get url(): string {
    return this.configService.get<string>('app.url') as string;
  }

  get port(): number {
    return Number(this.configService.get<number>('app.port')) as number;
  }
}
