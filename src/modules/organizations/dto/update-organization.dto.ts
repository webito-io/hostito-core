import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {

    @ApiProperty({ description: 'Organization name to update', type: String })
    @IsOptional()
    name: string;

    @ApiProperty({ description: 'Users id to update', type: [Number] })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    users: number[];
}
