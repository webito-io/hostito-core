import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { InvoiceEntity } from './entities/invoice.entity';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('invoices', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: InvoiceEntity,
  })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invoicesService.create(createInvoiceDto, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post(':id/pay')
  @ApiOperation({ summary: 'Initiate payment for an invoice' })
  @ApiResponse({ status: 200, description: 'Payment initiated' })
  async pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() payInvoiceDto: PayInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invoicesService.pay(id, payInvoiceDto.gatewayId, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('invoices', 'read', 'own')
  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({
    status: 200,
    description: 'Return all invoices',
    type: [InvoiceEntity],
  })
  async findAll(
    @Query() query: PaginationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invoicesService.findAll(
      query.page || 1,
      query.limit || 10,
      req.user,
    );
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('invoices', 'read', 'own')
  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single invoice',
    type: InvoiceEntity,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invoicesService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('invoices', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully',
    type: InvoiceEntity,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('invoices', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.remove(id);
  }
}
