import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentGatewaysService } from './payment-gateways.service';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PaymentGatewayEntity } from './entities/payment-gateway.entity';

@ApiTags('Payment Gateways')
@Controller('payment-gateways')
export class PaymentGatewaysController {
  constructor(
    private readonly paymentGatewaysService: PaymentGatewaysService,
  ) {}

  @Get('public')
  @ApiOperation({ summary: 'Get all active payment gateways (public info)' })
  @ApiResponse({ status: 200, type: [PaymentGatewayEntity] })
  async findAllPublic() {
    return await this.paymentGatewaysService.findAll({ pub: true });
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('payment-gateways', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all payment gateways including configs' })
  @ApiResponse({ status: 200, type: [PaymentGatewayEntity] })
  async findAll() {
    return await this.paymentGatewaysService.findAll({});
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('payment-gateways', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific payment gateway' })
  @ApiResponse({ status: 200, type: PaymentGatewayEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.paymentGatewaysService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('payment-gateways', 'update', 'all')
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a payment gateway' })
  @ApiResponse({ status: 200, type: PaymentGatewayEntity })
  async activate(@Param('id', ParseIntPipe) id: number) {
    return await this.paymentGatewaysService.activate(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('payment-gateways', 'update', 'all')
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a payment gateway' })
  @ApiResponse({ status: 200, type: PaymentGatewayEntity })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return await this.paymentGatewaysService.deactivate(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('payment-gateways', 'update', 'all')
  @Patch(':id/config')
  @ApiOperation({ summary: 'Update payment gateway config (e.g., API keys)' })
  @ApiResponse({ status: 200, type: PaymentGatewayEntity })
  async setConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentGatewayDto: UpdatePaymentGatewayDto,
  ) {
    return await this.paymentGatewaysService.setConfig(
      id,
      updatePaymentGatewayDto,
    );
  }
}
