import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('inventory')
@ApiTags('Inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventories' })
  @ApiResponse({ status: 200, description: 'Return all inventories.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
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
      skip,
      take,
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
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
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

  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory by id' })
  @ApiResponse({ status: 200, description: 'Return the inventory.' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get inventory for a specific product' })
  @ApiResponse({
    status: 200,
    description: 'Return the inventory for the product.',
  })
  findByProduct(@Param('productId') productId: string) {
    return this.inventoryService.findByProduct(productId);
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get inventory for a specific variant' })
  @ApiResponse({
    status: 200,
    description: 'Return the inventory for the variant.',
  })
  findByVariant(@Param('variantId') variantId: string) {
    return this.inventoryService.findByVariant(variantId);
  }

  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
