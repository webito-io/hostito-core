import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Status } from 'generated/prisma/enums';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({ description: 'User status' })
    @IsOptional()
    @IsEnum(Status)
    status?: Status;
  
    @ApiProperty({ description: 'User role ID' })
    @IsOptional()
    @IsNumber()
    roleId?: number;
}
