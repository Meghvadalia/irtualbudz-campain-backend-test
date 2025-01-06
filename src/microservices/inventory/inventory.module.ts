import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Inventory, InventorySchema } from './entities/inventory.entity';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';
import { Product, ProductSchema } from './entities/product.entity';
import { Company, CompanySchema } from 'src/model/company/entities/company.entity';
import { POS, POSSchema } from 'src/model/pos/entities/pos.entity';
import { Store, StoreSchema } from 'src/model/store/entities/store.entity';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { InventoryUpdatedLog, InventoryUpdatedLogSchema } from 'src/model/inventoryUpdatedLog/entities/inventoryUpdatedLog.entity';

@Module({
	imports: [
		DatabaseProviderModule,
		MongooseModule.forFeature([{ name: Inventory.name, schema: InventorySchema }]),
		MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
		MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
		MongooseModule.forFeature([{ name: POS.name, schema: POSSchema }]),
		MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
		MongooseModule.forFeature([{ name: InventoryUpdatedLog.name, schema: InventoryUpdatedLogSchema }])
	],
	controllers: [InventoryController],
	providers: [InventoryService],
})
export class InventoryModule {}
