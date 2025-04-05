import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateReviewReplyDto,
  UpdateReviewReplyDto,
} from './dto/create-review-reply.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    rating?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { rating, search, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (rating) {
      where.rating = rating;
    }

    if (search) {
      where.product = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: {
          product: true,
          user: true,
          replies: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async createReview(createReviewDto: CreateReviewDto, userId: string) {
    const { productId, rating, comment, image } = createReviewDto;

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
        image,
      },
    });

    return review;
  }

  async replyToReview(
    createReviewReplyDto: CreateReviewReplyDto,
    userId: string,
  ) {
    const { reviewId, comment } = createReviewReplyDto;

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found.`);
    }

    const reply = await this.prisma.reviewReply.create({
      data: {
        userId,
        reviewId,
        comment,
      },
    });

    return reply;
  }

  async updateReplyToReview(
    id: string,
    updateReviewReplyDto: UpdateReviewReplyDto,
    userId: string,
  ) {
    const existingReply = await this.prisma.reviewReply.findUnique({
      where: { id },
    });

    if (!existingReply) {
      throw new NotFoundException(`There is no reply yet for this review.`);
    }

    const { reviewId, comment } = updateReviewReplyDto;

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found.`);
    }

    const reply = await this.prisma.reviewReply.update({
      where: { id },
      data: {
        userId,
        reviewId,
        comment,
      },
    });

    return reply;
  }

  async getRepliesForProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: {
        replies: true,
      },
    });

    if (!reviews.length) {
      throw new NotFoundException(
        `No reviews found for product with ID ${productId}.`,
      );
    }

    return reviews;
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found.`);
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only delete your own reviews.');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully.' };
  }

  async deleteReviewReply(replyId: string, userId: string) {
    const reply = await this.prisma.reviewReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException(`Reply with ID ${replyId} not found.`);
    }

    if (reply.userId !== userId) {
      throw new BadRequestException('You can only delete your own replies.');
    }

    await this.prisma.reviewReply.delete({
      where: { id: replyId },
    });

    return { message: 'Reply deleted successfully.' };
  }
}
