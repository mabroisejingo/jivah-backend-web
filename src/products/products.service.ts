import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { variants, images, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants.map((variant) => ({
            color: variant.color,
            size: variant.size,
          })),
        },
        images: {
          create: images,
        },
      },
      include: {
        variants: {
          include: {
            Inventory: true,
          },
        },
        images: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      category?: string;
      tags?: string[];
      colors?: string[];
      sizes?: string[];
      search?: string;
    };
  }) {
    const { skip, take, orderBy, sortOrder, filters } = params;
    const where: any = {};

    if (filters) {
      if (filters.minPrice) where.price = { gte: filters.minPrice };
      if (filters.maxPrice)
        where.price = { ...where.price, lte: filters.maxPrice };
      if (filters.category) where.category = { equals: filters.category };
      if (filters.tags) where.tags = { hasSome: filters.tags };
      if (filters.colors)
        where.variants = { some: { color: { in: filters.colors } } };
      if (filters.sizes)
        where.variants = { some: { size: { in: filters.sizes } } };
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { category: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { tags: { hasSome: [filters.search] } },
        ];
      }
    }

    const products = await this.prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: orderBy ? { [orderBy]: sortOrder || 'asc' } : undefined,
      include: {
        variants: true,
      },
    });

    const total = await this.prisma.product.count({ where });

    return { products, total };
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            Inventory: true,
          },
        },
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { variants, images, ...productData } = updateProductDto;

    // Update product data
    await this.prisma.product.update({
      where: { id },
      data: productData,
    });

    // Update variants and inventory
    if (variants) {
      for (const variant of variants) {
        if (variant.id) {
          // Update existing variant
          await this.prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              color: variant.color,
              size: variant.size,
            },
          });
        } else {
          // Create new variant
          await this.prisma.productVariant.create({
            data: {
              productId: id,
              color: variant.color,
              size: variant.size,
            },
          });
        }
      }
    }
    if (images) {
      await this.prisma.productImage.deleteMany({
        where: { productId: id },
      });
      await this.prisma.productImage.createMany({
        data: images.map((image) => ({ ...image, productId: id })),
      });
    }

    return this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            Inventory: true,
          },
        },
        images: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories() {
    const categories = await this.prisma.category.findMany({
      include: { children: true, products: true },
    });
    return categories;
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, products: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async removeCategory(id: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, products: true },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (
      existingCategory.children.length > 0 ||
      existingCategory.products.length > 0
    ) {
      throw new Error(
        'Cannot delete a category with subcategories or products',
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
