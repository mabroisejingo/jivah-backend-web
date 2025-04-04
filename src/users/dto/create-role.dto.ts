import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Privilege } from '@prisma/client'; // Import Privilege enum from the Prisma client

export class CreateRoleDto {
  @ApiProperty({ description: 'The name of the role' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The privileges assigned to the role',
    enum: Privilege,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Privilege, { each: true })
  privileges: Privilege[];
}
