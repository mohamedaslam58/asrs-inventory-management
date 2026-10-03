import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetAssignmentController } from './asset-assignment.controller.js';
import { AssetAssignmentService } from './asset-assignment.service.js';
import { AssetAssignment } from './entities/asset-assignment.entity.js';
import { Item } from '../items/entities/item.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetAssignment, Item]),
  ],
  controllers: [AssetAssignmentController],
  providers: [AssetAssignmentService],
  exports: [AssetAssignmentService],
})
export class AssetAssignmentModule {}