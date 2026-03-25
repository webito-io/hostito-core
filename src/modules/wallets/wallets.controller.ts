import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { DepositWalletDto } from './dto/deposit.wallets.dto';
import { WithdrawWalletDto } from './dto/withdraw.wallets.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission, hasPermission } from 'src/common/decorators/permission.decorator';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Post('/deposit')
  @RequirePermission('payments', 'create', 'own')
  @ApiOperation({ summary: 'Deposit to wallet' })
  deposit(@Body() depositWalletDto: DepositWalletDto) {
    return this.walletsService.deposit(depositWalletDto);
  }

  @Get('/balance')
  @RequirePermission('payments', 'read', 'own')
  @ApiOperation({ summary: 'Get wallet balance' })
  balance(@Req() req) {
    return this.walletsService.balance(req.user.organizationId);
  }

}
