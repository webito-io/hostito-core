import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Headers,
  Req,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentGatewaysHandler } from './payment-gateways.handler';
import { PaymentGatewaysService } from './payment-gateways.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentGatewaysHandler: PaymentGatewaysHandler,
    private readonly paymentGatewaysService: PaymentGatewaysService,
  ) {}

  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('payments', 'read', 'own')
  @ApiOperation({ summary: 'Get all payments (Transactions) with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of transactions',
  })
  async findAllPayments(
    @Query() query: PaginationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentGatewaysService.findAllPayments(query, req.user);
  }

  @Get(':id/verify')
  @ApiOperation({ summary: 'Verify a payment (Callback/Return URL) via GET' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  async getVerify(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: Record<string, any>,
  ) {
    return this.paymentGatewaysHandler.verify(id, query);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a payment (Callback/Return URL) via POST' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  async postVerify(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    return this.paymentGatewaysHandler.verify(id, body);
  }

  @Post(':gateway/webhook')
  @ApiOperation({ summary: 'Handle raw payment webhook from external gateway' })
  @ApiResponse({ status: 200, description: 'Webhook acknowledged' })
  async webhook(
    @Param('gateway') gateway: string,
    @Headers() headers: Record<string, any>,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Raw body is required for webhooks');
    }
    return this.paymentGatewaysHandler.webhook(gateway, headers, req.rawBody);
  }
}
