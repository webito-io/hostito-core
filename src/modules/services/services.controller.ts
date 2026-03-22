import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('services', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('services', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all services with pagination' })
  @ApiResponse({ status: 200, description: 'List of services' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.servicesService.findAll(paginationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('services', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Return a single service' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('services', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a service by ID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('services', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service by ID' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }
}
