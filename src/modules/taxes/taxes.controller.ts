import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { TaxEntity } from './entities/tax.entity';
import { TaxesService } from './taxes.service';

@ApiTags('Taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('taxes', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new tax' })
  @ApiResponse({
    status: 201,
    description: 'Tax created successfully',
    type: TaxEntity,
  })
  async create(@Body() createTaxDto: CreateTaxDto) {
    return await this.taxesService.create(createTaxDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('taxes', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all taxes' })
  @ApiResponse({
    status: 200,
    description: 'Return all taxes',
    type: [TaxEntity],
  })
  async findAll(@Query() query: PaginationDto) {
    return await this.taxesService.findAll(query);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('taxes', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a tax by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single tax',
    type: TaxEntity,
  })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.taxesService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('taxes', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tax updated successfully',
    type: TaxEntity,
  })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaxDto: UpdateTaxDto,
  ) {
    return await this.taxesService.update(id, updateTaxDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('taxes', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax by ID' })
  @ApiResponse({ status: 200, description: 'Tax deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.taxesService.remove(id);
  }
}
