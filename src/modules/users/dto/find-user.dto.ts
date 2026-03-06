import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class FindUserDto {
  
    @ApiProperty({ description: 'page number' })
    @IsOptional()
    @IsNumber()
    page?: number;


    @ApiProperty({ description: 'limit number' })
    @IsOptional()
    @IsNumber()
    limit?: number;
}