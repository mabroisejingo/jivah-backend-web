import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'The image url of the category' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'The ID of the parent category',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
