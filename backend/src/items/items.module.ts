import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import { Item } from './entities/item.entity.js';

@Module({
  imports: [
    // Registers the Item entity with TypeORM for repository injection
    TypeOrmModule.forFeature([Item]),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService], // Optional: Export if other modules need to access ItemsService
})
export class ItemsModule {}