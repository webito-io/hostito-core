import { ApiProperty } from "@nestjs/swagger";
import { InputJsonValue } from "@prisma/client/runtime/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

import { IsPositive } from "class-validator";

export class CartItemDto {
    
    @ApiProperty({ description: 'Product ID' })
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    productId: number;

    @ApiProperty({ description: 'Configuration' })
    @IsOptional()
    config: InputJsonValue;

    @ApiProperty({ description: 'Quantity' })
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    quantity: number;
}
