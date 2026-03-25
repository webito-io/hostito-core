import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class CreatePaymentGatewayDto {
  @ApiPropertyOptional({ description: 'Gateway config as JSON object' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
