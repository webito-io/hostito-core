import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Status } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'User first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'User organization name' })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiProperty({ description: 'User organization ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizationId?: number;

  @ApiProperty({ description: 'User status' })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ description: 'User role ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  roleId: number;
}
