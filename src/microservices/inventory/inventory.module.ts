import { Module } from '@nestjs/common';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from './entities/inventory.entity';
import { DatabaseProviderModule } from 'src/providers/database/mongodb.module';

@Module({
	imports: [DatabaseProviderModule, MongooseModule.forFeature([{ name: Inventory.name, schema: InventorySchema }])],
	controllers: [InventoryController],
	providers: [InventoryService],
})
export class InventoryModule {}