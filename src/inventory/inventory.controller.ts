import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/jwt.guard';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { Privileges } from 'src/auth/privileges.decorator';
import { PrivilegesGuard } from 'src/auth/privileges.guard';
import { Privilege } from '@prisma/client';

@Controller('inventory')
@ApiTags('Inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventories' })
  @ApiResponse({ status: 200, description: 'Return all inventories.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'colors', required: false, type: [String] })
  @ApiQuery({ name: 'sizes', required: false, type: [String] })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() query: any) {
    const {
      page,
      limit,
      orderBy,
      sortOrder,
      minPrice,
      maxPrice,
      category,
      tags,
      colors,
      sizes,
      search,
    } = query;
    return this.inventoryService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      orderBy,
      sortOrder,
      filters: {
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        category,
        tags: tags ? tags.split(',') : undefined,
        colors: colors ? colors.split(',') : undefined,
        sizes: sizes ? sizes.split(',') : undefined,
        search,
      },
    });
  }

  @Get(':id/id')
  @ApiOperation({ summary: 'Get an inventory by id' })
  @ApiResponse({ status: 200, description: 'Return the inventory.' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get(':id/barcode')
  @ApiOperation({ summary: 'Get an inventory by barcode' })
  @ApiResponse({ status: 200, description: 'Return the inventory.' })
  findOneBarcode(@Param('id') id: string) {
    return this.inventoryService.findOneBarcode(id);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get paginated inventory for a specific product' })
  @ApiResponse({
    status: 200,
    description: 'Return the paginated inventory for the product.',
  })
  findByProduct(
    @Param('productId') productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.inventoryService.findByProduct(
      productId,
      Number(page),
      Number(limit),
    );
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get paginated inventory for a specific variant' })
  @ApiResponse({
    status: 200,
    description: 'Return the paginated inventory for the variant.',
  })
  findByVariant(
    @Param('variantId') variantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.inventoryService.findByVariant(
      variantId,
      Number(page),
      Number(limit),
    );
  }

  @Post()
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.CREATE_INVENTORY)
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Patch(':id/id')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.UPDATE_INVENTORY)
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id/id')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.DELETE_INVENTORY)
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Post(':id/discount')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.CREATE_DISCOUNTS)
  @ApiOperation({ summary: 'Add a discount to an inventory' })
  @ApiResponse({ status: 201, description: 'Discount added successfully.' })
  createDiscount(
    @Param('id') inventoryId: string,
    @Body() createDiscountDto: CreateDiscountDto,
  ) {
    return this.inventoryService.createDiscount(inventoryId, createDiscountDto);
  }

  @Get(':id/discounts')
  @ApiOperation({ summary: 'Get all discounts for an inventory' })
  @ApiResponse({
    status: 200,
    description: 'Return all discounts for the inventory.',
  })
  getAllDiscounts(@Param('id') inventoryId: string) {
    return this.inventoryService.getAllDiscounts(inventoryId);
  }

  @Patch('discount/:discountId')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.UPDATE_DISCOUNTS)
  @ApiOperation({ summary: 'Update an inventory discount' })
  @ApiResponse({ status: 200, description: 'Discount updated successfully.' })
  updateDiscount(
    @Param('discountId') discountId: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.inventoryService.updateDiscount(discountId, updateDiscountDto);
  }

  @Delete('discount/:discountId')
  @UseGuards(JwtGuard, PrivilegesGuard)
  @Privileges(Privilege.DELETE_DISCOUNTS)
  @ApiOperation({ summary: 'Delete an inventory discount' })
  @ApiResponse({ status: 200, description: 'Discount deleted successfully.' })
  removeDiscount(@Param('discountId') discountId: string) {
    return this.inventoryService.removeDiscount(discountId);
  }
}
