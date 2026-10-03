import { Controller, Get, Patch, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AssetAssignmentService } from './asset-assignment.service.js';

@Controller('asset-assignments')
export class AssetAssignmentController {
  constructor(private readonly service: AssetAssignmentService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Patch(':id/return')
  async markAsReturned(@Param('id', ParseIntPipe) id: number) {
    return this.service.markAsReturned(id);
  }
}