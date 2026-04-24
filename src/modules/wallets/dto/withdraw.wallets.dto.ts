import { IsNumber, IsPositive, IsOptional } from 'class-validator';

export class WithdrawWalletDto {
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
  invoiceId?: number;
}
