import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class DepositWalletDto {
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
