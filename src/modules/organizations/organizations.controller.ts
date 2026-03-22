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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';
import { OrganizationEntity } from './entities/organization.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('organizations', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
    type: OrganizationEntity,
  })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return await this.organizationsService.create(createOrganizationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('organizations', 'read', 'own')
  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({
    status: 200,
    description: 'Return all organizations',
    type: [OrganizationEntity],
  })
  async findAll(@Query() query: PaginationDto, @Req() req) {
    return await this.organizationsService.findAll(query, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('organizations', 'read', 'own')
  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single organization',
    type: OrganizationEntity,
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return await this.organizationsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('organizations', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization by ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
    type: OrganizationEntity,
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return await this.organizationsService.update(id, updateOrganizationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('organizations', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization by ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return await this.organizationsService.remove(id, req.user);
  }
}
