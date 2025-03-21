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
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/roles.decorator';

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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Patch(':id/id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id/id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
