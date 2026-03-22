import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({
    description: 'Coupon code to apply to the cart',
    required: false,
  })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
