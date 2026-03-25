import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentGatewayEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'stripe' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: { apiKey: 'sk_test_123', secret: 'abc' } })
  config?: Record<string, any>;

  @ApiProperty({ example: '2023-11-20T12:00:00Z' })
  updatedAt: Date;
}
