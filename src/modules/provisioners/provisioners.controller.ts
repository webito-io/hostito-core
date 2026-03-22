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
import { UpdateProvisionerDto } from './dto/update-provisioner.dto';
import { ProvisionersService } from './provisioners.service';

@ApiTags('Provisioners')
@Controller('provisioners')
export class ProvisionersController {
  constructor(private readonly provisionersService: ProvisionersService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('provisioners', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all provisioners' })
  @ApiResponse({ status: 200, description: 'List of provisioners' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.provisionersService.findAll(paginationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('provisioners', 'update', 'all')
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a provisioner' })
  @ApiResponse({ status: 200, description: 'Provisioner activated' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.provisionersService.activate(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('provisioners', 'update', 'all')
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a provisioner' })
  @ApiResponse({ status: 200, description: 'Provisioner deactivated' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.provisionersService.deactivate(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('provisioners', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Configure a provisioner' })
  @ApiResponse({ status: 200, description: 'Provisioner configured' })
  configure(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProvisionerDto: UpdateProvisionerDto,
  ) {
    return this.provisionersService.configure(id, updateProvisionerDto);
  }
}
