import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOwnUserDto {
    @ApiProperty({ description: 'Your first name' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ description: 'Your last name' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ description: 'Your Password' })
    @IsOptional()
    @IsString()
    password?: string;
}
