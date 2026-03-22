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
import { DomainsService } from './domains.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { DomainEntity } from './entities/domain.entity';
import { CheckDomainDto } from './dto/check-domain.dto';

@ApiTags('Domains')
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('check')
  @ApiOperation({ summary: 'Check domain availability' })
  @ApiResponse({ status: 200, type: CheckDomainDto })
  async check(@Query('domain') domain: string) {
    return await this.domainsService.check(domain);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all domains' })
  @ApiResponse({ status: 200, type: [DomainEntity] })
  async findAll(@Query() query: PaginationDto, @Req() req) {
    return await this.domainsService.findAll(query, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get a domain by ID' })
  @ApiResponse({ status: 200, type: DomainEntity })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return await this.domainsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a domain by ID' })
  @ApiResponse({ status: 200, type: DomainEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDomainDto: UpdateDomainDto,
    @Req() req,
  ) {
    return await this.domainsService.update(id, updateDomainDto, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a domain by ID' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return await this.domainsService.remove(id, req.user);
  }
}
