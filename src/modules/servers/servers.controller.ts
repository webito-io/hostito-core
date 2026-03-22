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
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';

@ApiTags('Servers')
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('servers', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new server' })
  @ApiResponse({ status: 201, description: 'Server created successfully' })
  create(@Body() createServerDto: CreateServerDto) {
    return this.serversService.create(createServerDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('servers', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all servers with pagination' })
  @ApiResponse({ status: 200, description: 'List of servers' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.serversService.findAll(paginationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('servers', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a server by ID' })
  @ApiResponse({ status: 200, description: 'Return a single server' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serversService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('servers', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a server by ID' })
  @ApiResponse({ status: 200, description: 'Server updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServerDto: UpdateServerDto,
  ) {
    return this.serversService.update(id, updateServerDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('servers', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a server by ID' })
  @ApiResponse({ status: 200, description: 'Server deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serversService.remove(id);
  }
}
