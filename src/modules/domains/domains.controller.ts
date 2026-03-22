import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { DomainEntity } from './entities/domain.entity';

@ApiTags('Domains')
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new domain' })
  @ApiResponse({ status: 201, type: DomainEntity })
  async create(@Body() createDomainDto: CreateDomainDto) {
    return await this.domainsService.create(createDomainDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'own')
  @Get()
  @ApiOperation({ summary: 'Get all domains' })
  @ApiResponse({ status: 200, type: [DomainEntity] })
  async findAll(@Query() query: PaginationDto, @Req() req) {
    return await this.domainsService.findAll(query, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'own')
  @Get(':id')
  @ApiOperation({ summary: 'Get a domain by ID' })
  @ApiResponse({ status: 200, type: DomainEntity })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return await this.domainsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'update', 'own')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a domain by ID' })
  @ApiResponse({ status: 200, type: DomainEntity })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDomainDto: UpdateDomainDto, @Req() req) {
    return await this.domainsService.update(id, updateDomainDto, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'delete', 'own')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a domain by ID' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return await this.domainsService.remove(id, req.user);
  }
}
