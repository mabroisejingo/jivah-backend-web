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
    page?: number;
    limit?: number;
    orderBy?: 'most_popular' | 'least_popular' | 'latest' | 'trending' | string;
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
    const { page = 1, limit = 10, orderBy, sortOrder, filters } = params;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters) {
      if (filters.minPrice || filters.maxPrice) {
        where.price = {
          gte: filters.minPrice,
          lte: filters.maxPrice,
        };
      }
      if (filters.colors) where.variant = { color: { in: filters.colors } };
      if (filters.sizes) where.variant = { size: { in: filters.sizes } };
    }

    let orderByClause: any = {};
    if (orderBy) {
      switch (orderBy) {
        case 'most_popular':
          orderByClause = {
            variant: { product: { orders: { _count: 'desc' } } },
          };
          break;
        case 'least_popular':
          orderByClause = {
            variant: { product: { orders: { _count: 'asc' } } },
          };
          break;
        case 'latest':
          orderByClause = { updatedAt: 'desc' };
          break;
        case 'trending':
          orderByClause = {
            variant: { product: { Favorite: { _count: 'desc' } } },
          };
          break;
        default:
          orderByClause = { [orderBy]: sortOrder || 'asc' };
      }
    }

    const inventories = await this.prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByClause,
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: true,
                variants: true,
                reviews: true,
                Favorite: true,
                images: true,
              },
            },
          },
        },
        discounts: true,
      },
    });

    const total = await this.prisma.inventory.count({ where });

    const products = inventories.map(
      ({ variant, price, quantity, updatedAt, discounts }) => ({
        price,
        quantity,
        updatedAt,
        discounts,
        name: variant.product.name,
        image: variant.product.images.find(
          (image) => image.color === variant.color,
        )
          ? variant.product.images.filter(
              (image) => image.color === variant.color,
            )[0].url
          : variant.product.images[0].url,
        description: variant.product.description,
        category: variant.product.category.name,
        tags: variant.product.tags,
        color: variant.color,
        size: variant.size,
        productId: variant.productId,
      }),
    );
    return {
      items: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        reviews: true,
        category: true,
        variants: {
          include: {
            Inventory: true,
          },
        },
      },
    });
    return product;
  }

  async getRelatedProducts(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const where: any = {
      id: { not: id },
      OR: [
        { categoryId: product.categoryId },
        { tags: { hasSome: product.tags } },
      ],
    };
    const relatedProducts = await this.prisma.product.findMany({
      where,
      take: 10,
      include: {
        variants: {
          include: {
            Inventory: {
              include: {
                discounts: true,
              },
            },
          },
        },
        images: true,
        category: true,
      },
    });
    const transformedProducts = relatedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category.name,
      tags: product.tags,
      image: product.images[0]?.url,
      price: product.variants[0]?.Inventory[0]?.price,
      discounts: product.variants[0]?.Inventory[0]?.discounts,
      variants: product.variants.map((variant) => ({
        color: variant.color,
        size: variant.size,
        quantity: variant.Inventory[0]?.quantity,
      })),
    }));

    return transformedProducts;
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

  async getBestDeals(limit: number) {
    const where: any = {};
    const inventories = await this.prisma.inventory.findMany({
      where,
      take: limit,
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: true,
                variants: true,
                reviews: true,
                Favorite: true,
                images: true,
              },
            },
          },
        },
        discounts: true,
      },
    });
    inventories.sort((a, b) => b.discounts.length - a.discounts.length);
    const products = inventories.map(
      ({ variant, price, quantity, updatedAt, discounts }) => ({
        price,
        quantity,
        updatedAt,
        discounts,
        name: variant.product.name,
        image: variant.product.images.find(
          (image) => image.color === variant.color,
        )
          ? variant.product.images.filter(
              (image) => image.color === variant.color,
            )[0].url
          : variant.product.images[0].url,
        description: variant.product.description,
        category: variant.product.category.name,
        tags: variant.product.tags,
        color: variant.color,
        size: variant.size,
        productId: variant.productId,
      }),
    );

    return products;
  }

  async getLatestProducts(limit: number) {
    return this.prisma.product.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        variants: true,
      },
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
