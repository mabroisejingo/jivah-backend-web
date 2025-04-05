import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Delete,
  UseGuards,
  Req,
  Query,
  Put,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  CreateReviewReplyDto,
  UpdateReviewReplyDto,
} from './dto/create-review-reply.dto';

@Controller('reviews')
@UseGuards(JwtGuard)
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @Get()
  async findAll(
    @Query('rating') rating?: number,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewService.findAll({
      rating: rating ? Number(rating) : undefined,
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Post()
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: Request,
  ) {
    return this.reviewService.createReview(createReviewDto, req.user.id);
  }

  @Post('reply')
  async replyToReview(
    @Body() createReviewReplyDto: CreateReviewReplyDto,
    @Req() req: Request,
  ) {
    return this.reviewService.replyToReview(createReviewReplyDto, req.user.id);
  }

  @Put('reply/:id')
  async updateReplyToReview(
    @Param('id') replyId: string,
    @Body() updateReviewReplyDto: UpdateReviewReplyDto,
    @Req() req: Request,
  ) {
    return this.reviewService.updateReplyToReview(
      replyId,
      updateReviewReplyDto,
      req.user.id,
    );
  }

  @Get(':productId/replies')
  async getRepliesForProduct(@Param('productId') productId: string) {
    return this.reviewService.getRepliesForProduct(productId);
  }

  @Delete(':reviewId')
  async deleteReview(@Param('reviewId') reviewId: string, @Req() req: Request) {
    return this.reviewService.deleteReview(reviewId, req.user.id);
  }

  @Delete('reply/:replyId')
  async deleteReviewReply(
    @Param('replyId') replyId: string,
    @Req() req: Request,
  ) {
    return this.reviewService.deleteReviewReply(replyId, req.user.id);
  }
}
