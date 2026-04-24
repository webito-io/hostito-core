import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
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
import { RegistrarsService } from './registrars.service';
import { UpdateRegistrarDto } from './dto/update-registrar.dto';

@ApiTags('Registrars')
@Controller('registrars')
export class RegistrarsController {
  constructor(private readonly registrarsService: RegistrarsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all registrars' })
  @ApiResponse({ status: 200, description: 'List of registrars' })
  findAll(@Query() query: PaginationDto) {
    return this.registrarsService.findAll(query);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a registrar by ID' })
  @ApiResponse({ status: 200, description: 'Registrar details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.registrarsService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'update', 'all')
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a registrar' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.registrarsService.activate(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'update', 'all')
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a registrar' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.registrarsService.deactivate(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('domains', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Configure a registrar' })
  configure(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegistrarDto,
  ) {
    return this.registrarsService.configure(id, dto);
  }
}
