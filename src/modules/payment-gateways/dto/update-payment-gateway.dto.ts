import { PartialType } from '@nestjs/swagger';
import { CreatePaymentGatewayDto } from './create-payment-gateway.dto';

export class UpdatePaymentGatewayDto extends PartialType(
  CreatePaymentGatewayDto,
) {}
