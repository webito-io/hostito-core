import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { DomainsService } from './domains.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { DomainEntity } from './entities/domain.entity';
import { CheckDomainDto } from './dto/check-domain.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';

@ApiTags('Domains')
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'own')
  @Get('check')
  @ApiOperation({ summary: 'Check domain availability' })
  @ApiResponse({ status: 200, type: CheckDomainDto })
  async check(@Query('domain') domain: string) {
    return this.domainsService.check(domain);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'own')
  @Get()
  @ApiOperation({ summary: 'Get all domains' })
  @ApiResponse({ status: 200, type: [DomainEntity] })
  async findAll(
    @Query() query: PaginationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.findAll(query, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'own')
  @Get(':id')
  @ApiOperation({ summary: 'Get a domain by ID' })
  @ApiResponse({ status: 200, type: DomainEntity })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'update', 'own')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a domain by ID' })
  @ApiResponse({ status: 200, type: DomainEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDomainDto: UpdateDomainDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.update(id, updateDomainDto, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'update', 'own')
  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renew a domain' })
  @ApiResponse({ status: 200 })
  async renew(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.renew(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'update', 'own')
  @Patch(':id/transfer')
  @ApiOperation({ summary: 'Transfer a domain' })
  @ApiResponse({ status: 200 })
  async transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body('authCode') authCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.transfer(id, authCode, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'own')
  @Get(':id/auth-code')
  @ApiOperation({ summary: 'Get domain auth/EPP code' })
  @ApiResponse({ status: 200 })
  async getAuthCode(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.getAuthCode(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a domain by ID' })
  @ApiResponse({ status: 200 })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.domainsService.remove(id, req.user);
  }
}
