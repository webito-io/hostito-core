import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionEntity, RoleEntity } from './entities/role.entity';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('roles', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: RoleEntity,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('roles', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Return all roles',
    type: [RoleEntity],
  })
  async findAll(@Query() query: PaginationDto) {
    return await this.rolesService.findAll(query);
  }

  @UseGuards(AuthGuard)
  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({
    status: 200,
    description: 'Return all permissions',
    type: [PermissionEntity],
  })
  async findAllPermissions() {
    return await this.rolesService.findAllPermissions();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('roles', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single role',
    type: RoleEntity,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string) {
    return await this.rolesService.findOne(+id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('roles', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a role by ID' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleEntity,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.rolesService.update(+id, updateRoleDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('roles', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role by ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string) {
    return await this.rolesService.remove(+id);
  }
}
