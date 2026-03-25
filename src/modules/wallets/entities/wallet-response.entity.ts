import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceResponse {
  @ApiProperty({ example: 100.5, description: 'Current balance of the organization' })
  balance: number;

  @ApiProperty({ example: 1, description: 'ID of the currency used for the balance' })
  currencyId: number;
}

export class WalletDepositResponse {
  @ApiProperty({ description: 'Created transaction record' })
  transaction: any;

  @ApiProperty({ description: 'Payment gateway initiation result' })
  payment: any;
}
