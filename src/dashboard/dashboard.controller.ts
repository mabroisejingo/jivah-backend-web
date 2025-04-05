import { Controller, Get, Query, Res } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Query('range') dateRange: string) {
    return this.dashboardService.getDashboardStats(dateRange);
  }

  @Get('report')
  async generateReport(
    @Query('range') dateRange: string,
    @Res() res: Response,
  ) {
    try {
      const reportBlob = await this.dashboardService.generateReport(dateRange);

      // Convert Blob to Buffer
      const buffer = Buffer.from(await reportBlob.arrayBuffer());

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Jivah_Collections_Report.pdf"',
      );

      // Send the Buffer as the response
      res.end(buffer);
    } catch (error) {
      // Handle errors if report generation fails
      res.status(500).send('Error generating report');
    }
  }

  @Get('graph')
  async getGraphData() {
    return this.dashboardService.getGraphData();
  }

  @Get('most-sold-products')
  async getMostSoldProducts(@Query('range') dateRange: string) {
    return this.dashboardService.getMostSoldProducts(dateRange);
  }
}
