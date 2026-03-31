import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { DepositWalletDto } from './dto/deposit.wallets.dto';
import { WalletBalanceResponse, WalletDepositResponse } from './entities/wallet-response.entity';
import { WalletsService } from './wallets.service';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Post('/deposit')
  @RequirePermission('payments', 'create', 'own')
  @ApiOperation({ summary: 'Deposit to wallet' })
  @ApiCreatedResponse({ type: WalletDepositResponse })
  deposit(@Body() depositWalletDto: DepositWalletDto , @Req() req) {
    return this.walletsService.deposit(depositWalletDto , req.user);
  }

  @Get('/balance')
  @RequirePermission('payments', 'read', 'own')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiOkResponse({ type: WalletBalanceResponse })
  balance(@Req() req) {
    return this.walletsService.balance(req.user.organizationId);
  }

}
