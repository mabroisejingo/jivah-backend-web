import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReviewReplyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reviewId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comment: string;
}

export class UpdateReviewReplyDto extends PartialType(CreateReviewReplyDto) {}
