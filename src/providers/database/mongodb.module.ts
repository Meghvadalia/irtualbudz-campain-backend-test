import { Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongodbConfigModule } from 'src/config/database/mongodb/config.module';
import { MongodbConfigService } from 'src/config/database/mongodb/config.service';
import * as mongoose from 'mongoose';

// somewhere in your code
mongoose.set('debug', true);
@Module({
	imports: [
		MongooseModule.forRootAsync({
			imports: [MongodbConfigModule],
			useFactory: async (mongodbConfigService: MongodbConfigService) => ({
				uri: mongodbConfigService.shouldAuthenticate()
					? `${mongodbConfigService.protocol}://${encodeURIComponent(
						mongodbConfigService.userName
					  )}:${encodeURIComponent(mongodbConfigService.password)}@${mongodbConfigService.host}:${
						mongodbConfigService.port
					  }/${mongodbConfigService.database}`
					: `${mongodbConfigService.protocol}://${mongodbConfigService.host}:${mongodbConfigService.port}/${mongodbConfigService.database}`,
			}),
			inject: [MongodbConfigService],
		} as MongooseModuleOptions),
	],
})
export class DatabaseProviderModule {}
