import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Privilege, Sale } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request, Response } from 'express';
import { JwtGuard } from 'src/auth/jwt.guard';
import { PrivilegesGuard } from 'src/auth/privileges.guard';
import { Privileges } from 'src/auth/privileges.decorator';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({
    status: 201,
    description: 'The sale has been successfully created.',
  })
  @UseGuards(JwtGuard, PrivilegesGuard)
  async create(@Body() createSaleDto: CreateSaleDto, @Res() res: Response) {
    try {
      const reportBlob = await this.salesService.create(createSaleDto);
      const buffer = Buffer.from(await reportBlob.arrayBuffer());
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Reciept.pdf"',
      );
      res.end(buffer);
    } catch (error) {
      console.log(error);
      res.status(500).send('Error generating report');
    }
    return this.salesService.create(createSaleDto);
  }

  @Post('order')
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({
    status: 201,
    description: 'The sale has been successfully created.',
  })
  createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Sale> {
    return this.salesService.createOrder(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @UseGuards(JwtGuard, PrivilegesGuard)
  @ApiResponse({ status: 200, description: 'Return all sales.' })
  findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    return this.salesService.findAll(
      type,
      status,
      pageInt,
      limitInt,
      search,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('mine')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @ApiOperation({ summary: 'Get all sales for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all sales for the current user.',
  })
  async findAllMine(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    const filters = {
      status,
      type,
      page: pageInt,
      limit: limitInt,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.salesService.findAllMine(filters, req.user);
  }

  @Get(':id/product')
  @ApiOperation({ summary: 'Get all sales by product' })
  @UseGuards(JwtGuard, PrivilegesGuard)
  @ApiResponse({ status: 200, description: 'Return all sales by product.' })
  findAllByProduct(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    return this.salesService.findAllByProduct(
      id,
      type,
      status,

      pageInt,
      limitInt,
      search,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id/id')
  @ApiOperation({ summary: 'Get a sale by id' })
  @UseGuards(JwtGuard, PrivilegesGuard)
  @ApiResponse({ status: 200, description: 'Return the sale.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  findOne(@Param('id') id: string): Promise<Sale> {
    return this.salesService.findOne(id);
  }

  @Delete(':id/id')
  @ApiOperation({ summary: 'Cancel a sale' })
  @ApiResponse({
    status: 200,
    description: 'The sale has been successfully cancelled.',
  })
  @UseGuards(JwtGuard, PrivilegesGuard)
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  remove(@Param('id') id: string): Promise<Sale> {
    return this.salesService.remove(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.UPDATE_ORDERS)
  @ApiResponse({ status: 200, description: 'Order successfully canceled.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 400, description: 'Invalid cancel reason.' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelReasonDto: { reason: string },
    @Req() req: Request,
  ): Promise<Sale> {
    return this.salesService.cancelOrder(id, cancelReasonDto, req.user);
  }

  @Post(':id/delivering')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.UPDATE_ORDERS)
  @ApiOperation({ summary: 'Set order status to delivering' })
  @ApiResponse({
    status: 200,
    description: 'Order status successfully set to delivering.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async setOrderToDelivering(@Param('id') id: string): Promise<Sale> {
    return this.salesService.setOrderToDelivering(id);
  }

  @Post(':id/completed')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.UPDATE_ORDERS)
  @ApiOperation({ summary: 'Set order status to completed' })
  @ApiResponse({
    status: 200,
    description: 'Order status successfully set to completed.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async setOrderToCompleted(@Param('id') id: string): Promise<Sale> {
    return this.salesService.setOrderToCompleted(id);
  }

  @Post(':id/refund-request')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.UPDATE_ORDERS)
  @ApiOperation({ summary: 'Request a refund for an order' })
  @ApiResponse({
    status: 200,
    description: 'Refund request successfully created.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 400, description: 'Invalid refund request message.' })
  async requestRefund(
    @Param('id') id: string,
    @Body() refundRequestDto: { message: string },
  ): Promise<Sale> {
    return this.salesService.requestRefund(id, refundRequestDto);
  }

  @Post(':id/complete-refund')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.UPDATE_ORDERS)
  @ApiOperation({ summary: 'Complete refund for an order' })
  @ApiResponse({
    status: 200,
    description: 'Refund completed and payment returned.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 400, description: 'Refund process failed.' })
  async completeRefund(
    @Param('id') id: string,
    @Body() refundRequestDto: { message: string; action: 'ACCEPT' | 'REJECT' },
  ): Promise<Sale> {
    return this.salesService.completeRefund(id, refundRequestDto);
  }
}
