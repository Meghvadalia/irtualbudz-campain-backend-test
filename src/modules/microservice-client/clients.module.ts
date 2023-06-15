import { Module, OnModuleInit } from '@nestjs/common';
import { ClientOrderController } from './controllers/client.order.controller';
import { ClientOrderService } from './services/client.order.service';
import { UserController } from './controllers/user.controller';
import { seederService } from 'src/common/seeders/seeders';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { Store, StoreSchema } from 'src/model/store/entities/store.entity';
import { StoreService } from './services/store.service';
import { StoreController } from './controllers/store.controller';
import { MetricsController } from './controllers/metrcis.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: POS.name, schema: POSSchema },
			{ name: Company.name, schema: CompanySchema },
			{ name: Store.name, schema: StoreSchema },
		]),
	],
	controllers: [
		ClientOrderController,
		UserController,
		StoreController,
		MetricsController,
	],
	providers: [ClientOrderService, seederService, StoreService],
})
export class MicroserviceClientModule {}
