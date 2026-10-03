import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('valuation')
  async getValuation() {
    return this.reportsService.getValuation();
  }

  @Get('turnover')
  async getTurnover() {
    return this.reportsService.getTurnover();
  }

  @Get('slow-moving')
  async getSlowMoving() {
    return this.reportsService.getSlowMoving();
  }

  @Get('forecast')
  async getForecast() {
    return this.reportsService.getDemandForecast();
  }
}