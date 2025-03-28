import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from '@prisma/client';

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
  create(@Body() createSaleDto: CreateSaleDto): Promise<Sale> {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({ status: 200, description: 'Return all sales.' })
  findAll(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    return this.salesService.findAll(status, page, limit, search);
  }

  @Get(':id/product')
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({ status: 200, description: 'Return all sales.' })
  findAllByProduct(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number }> {
    return this.salesService.findAllByProduct(id, status, page, limit, search);
  }

  @Get(':id/id')
  @ApiOperation({ summary: 'Get a sale by id' })
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
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  remove(@Param('id') id: string): Promise<Sale> {
    return this.salesService.remove(id);
  }
}
