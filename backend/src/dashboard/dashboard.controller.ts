import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
// Import your JwtAuthGuard if authentication is required
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
// @UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }
}