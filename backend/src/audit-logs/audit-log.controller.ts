import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service.js';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getAuditLogs(@Query('search') search?: string) {
    return this.auditLogService.findAll(search);
  }
}