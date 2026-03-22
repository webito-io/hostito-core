import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsNumber()
  @Type(() => Number)
  transactionId: number;

  @ApiProperty({ description: 'Gateway ID' })
  @IsNumber()
  @Type(() => Number)
  gatewayId: number;

  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: 'Currency ID' })
  @IsNumber()
  @Type(() => Number)
  currencyId: number;
}
