import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UtilsService } from 'src/utils/utils.service';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private utils: UtilsService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const { images, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,
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

  async addVariant(productId: string, variantData: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const newVariant = await this.prisma.productVariant.create({
      data: {
        size: variantData.size,
        color: variantData.color,
        productId,
      },
      include: {
        Inventory: true,
      },
    });

    await this.prisma.productImage.create({
      data: {
        url: variantData.image,
        color: variantData.color,
        productId,
      },
    });

    return newVariant;
  }

  async removeVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    return this.prisma.productVariant.delete({
      where: { id: variantId },
    });
  }

  async updateVariant(variantId: string, updateData: UpdateVariantDto) {
    const { image, ...otherData } = updateData;
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    const updatedVariant = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: otherData,
      include: {
        Inventory: true,
      },
    });

    if (image) {
      await this.prisma.productImage.create({
        data: {
          url: image,
          color: updateData.color,
          productId: variant.productId,
        },
      });
    }

    return updatedVariant;
  }

  async findAll(
    params: {
      page?: number;
      limit?: number;
      orderBy?:
        | 'most_popular'
        | 'least_popular'
        | 'latest'
        | 'trending'
        | string;
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
    },
    req: any,
  ) {
    console.log(params);
    let userId: string | null = null;

    try {
      const authorization = req.headers.authorization || '';
      const token = authorization.split(' ')[1];
      if (token) {
        const decoded = (await this.utils.verifyToken(token)) as any;
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.id },
        });
        if (user) {
          userId = user.id;
        }
      }
    } catch (error) {
      console.warn(
        'Token verification failed or user not found. Continuing without user ID.',
      );
    }
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
      if (filters.category) {
        where.variant = { product: { category: { name: filters.category } } };
      }
      if (filters.search) {
        where.variant = {
          product: {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { tags: { hasSome: [filters.search] } },
            ],
          },
        };
      }
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
                Favorite: userId ? { where: { userId } } : false,
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
        isFavorited:
          variant.product.Favorite && variant.product.Favorite.length > 0,
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

  async findAllProducts(params: {
    page?: number;
    limit?: number;
    filters?: {
      category?: string;
      tags?: string[];
      colors?: string[];
      sizes?: string[];
      search?: string;
    };
  }) {
    const { page = 1, limit = 10, filters } = params;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters) {
      if (filters.category) where.category = { name: filters.category };
      if (filters.tags) where.tags = { hasSome: filters.tags };
      if (filters.search)
        where.name = { contains: filters.search, mode: 'insensitive' };
    }

    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        variants: true,
        reviews: true,
        Favorite: true,
        images: true,
      },
    });

    const total = await this.prisma.product.count({ where });

    const formattedProducts = products.map((product) => ({
      name: product.name,
      description: product.description,
      category: product.category,
      tags: product.tags,
      images: product.images,
      variants: product.variants.map(({ color, size, id }) => ({
        color,
        size,
        variantId: id,
      })),
      reviewsCount: product.reviews.length,
      isFavorite: product.Favorite.length > 0,
      productId: product.id,
    }));

    return {
      items: formattedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFavoriteProducts(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      orderBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const { page = 1, limit = 10, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    let orderByClause: any = {};
    if (orderBy) {
      orderByClause = { [orderBy]: sortOrder || 'asc' };
    } else {
      // Default ordering
      orderByClause = { createdAt: 'desc' };
    }

    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: orderByClause,
      include: {
        product: {
          include: {
            category: true,
            variants: {
              include: {
                Inventory: true,
              },
            },
            images: true,
            reviews: true,
          },
        },
      },
    });

    const total = await this.prisma.favorite.count({ where: { userId } });

    const formattedProducts = favorites.map(({ product }) => ({
      productId: product.id,
      name: product.name,
      description: product.description,
      category: product.category.name,
      tags: product.tags,
      image: product.images.length > 0 ? product.images[0].url : null,
      variants: product.variants.map(({ color, size, id, Inventory }) => ({
        color,
        size,
        variantId: id,
        price: Inventory[0].price,
        quantity: Inventory[0].quantity,
      })),
      reviewsCount: product.reviews.length,
      isFavorite: true,
    }));

    return {
      items: formattedProducts,
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
    const { images, ...productData } = updateProductDto;

    await this.prisma.product.update({
      where: { id },
      data: productData,
    });

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
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }

    try {
      await this.prisma.product.update({
        where: { id },
        data: { deleted: true },
      });
      return { message: 'Product deactivated successfully' };
    } catch (error) {
      console.error('Error removing product:', error);
      throw new InternalServerErrorException(
        'An error occurred while removing the product.',
      );
    }
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
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        name: createCategoryDto.name,
      },
    });

    if (existingCategory) {
      throw new HttpException(
        'Category already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

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
      throw new BadRequestException('Cannot delete a category with  products');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getFilterOptions() {
    const sizes = await this.prisma.productVariant.findMany({
      select: { size: true },
      distinct: ['size'],
    });
    const colors = await this.prisma.productVariant.findMany({
      select: { color: true },
      distinct: ['color'],
    });
    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true },
    });
    const tags = await this.prisma.product.findMany({
      select: { tags: true },
    });
    return {
      sizes: sizes.map((s) => s.size).filter(Boolean),
      colors: colors.map((c) => c.color).filter(Boolean),
      categories: categories.map((c) => c.name).filter(Boolean),
      tags: [...new Set(tags.flatMap((p) => p.tags))],
    };
  }
}
