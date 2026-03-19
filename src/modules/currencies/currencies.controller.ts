import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { OptionalAuthGuard } from 'src/common/guards/optional.guard';
import { CurrencyEntity } from './entities/currency.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) { }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('currencies', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new currency' })
  @ApiResponse({
    status: 201,
    description: 'Currency created successfully',
    type: CurrencyEntity,
  })
  async create(@Body() createCurrencyDto: CreateCurrencyDto) {
    return await this.currenciesService.create(createCurrencyDto);
  }

  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all currencies' })
  @ApiResponse({
    status: 200,
    description: 'Return all currencies',
    type: [CurrencyEntity],
  })
  async findAll(@Query() query: PaginationDto, @Req() req) {
    return await this.currenciesService.findAll(query, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('currencies', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a currency by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single currency',
    type: CurrencyEntity,
  })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.currenciesService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('currencies', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a currency by ID' })
  @ApiResponse({
    status: 200,
    description: 'Currency updated successfully',
    type: CurrencyEntity,
  })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ) {
    return await this.currenciesService.update(id, updateCurrencyDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('currencies', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a currency by ID' })
  @ApiResponse({ status: 200, description: 'Currency deleted successfully' })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.currenciesService.remove(id);
  }
}
