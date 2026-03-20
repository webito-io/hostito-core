import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { OrderStatus } from 'generated/prisma';

export class UpdateOrderDto {
  @ApiProperty({
    description: 'The status of the order',
    example: 'pending',
  })
  @IsOptional()
  status: OrderStatus;
}
