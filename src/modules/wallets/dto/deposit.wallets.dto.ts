import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class DepositWalletDto {
  @IsOptional()
  @IsNumber()
  organizationId?: number;

  @IsNumber()
  currencyId: number;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsNumber()
  gatewayId?: number;

  @IsOptional()
  @IsString()
  gatewayRef?: string;
}