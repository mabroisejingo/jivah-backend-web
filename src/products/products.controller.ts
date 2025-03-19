import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
@ApiTags('Products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderBy') orderBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('colors') colors?: string,
    @Query('sizes') sizes?: string,
    @Query('search') search?: string,
    @Req() req?: Request,
  ) {
    return this.productsService.findAll(
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        orderBy,
        sortOrder: sortOrder as any,
        filters: {
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          category,
          tags: tags ? tags.split(',') : undefined,
          colors: colors ? colors.split(',') : undefined,
          sizes: sizes ? sizes.split(',') : undefined,
          search,
        },
      },
      req,
    );
  }

  @Get('products')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  findAllProducts(@Query() query: any) {
    const { page, limit, category, tags, colors, sizes, search } = query;

    return this.productsService.findAllProducts({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      filters: {
        category,
        tags: tags ? tags.split(',') : undefined,
        colors: colors ? colors.split(',') : undefined,
        sizes: sizes ? sizes.split(',') : undefined,
        search,
      },
    });
  }

  @Get('favorites')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get favorite products for the logged-in user' })
  @ApiResponse({ status: 200, description: 'Returns the favorite products' })
  async getFavoriteProducts(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
    @Req() req: Request,
  ) {
    return this.productsService.getFavoriteProducts(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      orderBy,
      sortOrder,
    });
  }

  @Get('best-deals')
  @ApiOperation({ summary: 'Get top best deals' })
  @ApiResponse({ status: 200, description: 'Returns the top best deals' })
  getBestDeals(@Query('limit') limit: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10; // Default to 10 if not specified
    return this.productsService.getBestDeals(limitNumber);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest products' })
  @ApiResponse({ status: 200, description: 'Returns the latest products' })
  getLatestProducts(@Query('limit') limit: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10; // Default to 10 if not specified
    return this.productsService.getLatestProducts(limitNumber);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  @ApiResponse({ status: 200, description: 'Returns related products' })
  getRelatedProducts(@Param('id') id: string) {
    return this.productsService.getRelatedProducts(id);
  }

  @Get(':id/id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
  @Patch(':id/id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id/id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('categories')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
  })
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Return all categories.' })
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiResponse({ status: 200, description: 'Return the category.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  findOneCategory(@Param('id') id: string) {
    return this.productsService.findOneCategory(id);
  }

  @Patch('categories/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.productsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  removeCategory(@Param('id') id: string) {
    return this.productsService.removeCategory(id);
  }

  @Get('filters')
  async getFilterOptions() {
    return this.productsService.getFilterOptions();
  }
}
