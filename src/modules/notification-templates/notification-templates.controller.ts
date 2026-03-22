import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
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
import { NotificationTemplatesService } from './notification-templates.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { NotificationTemplateEntity } from './entities/notification-template.entity';

@ApiTags('Notification Templates')
@Controller('notification-templates')
export class NotificationTemplatesController {
  constructor(
    private readonly notificationTemplatesService: NotificationTemplatesService,
  ) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('notification-templates', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiResponse({ status: 201, type: NotificationTemplateEntity })
  async create(
    @Body() createNotificationTemplateDto: CreateNotificationTemplateDto,
  ) {
    return await this.notificationTemplatesService.create(
      createNotificationTemplateDto,
    );
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('notification-templates', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({ status: 200, type: [NotificationTemplateEntity] })
  async findAll(@Query() query: PaginationDto) {
    return await this.notificationTemplatesService.findAll(query);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('notification-templates', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get an notification template by ID' })
  @ApiResponse({ status: 200, type: NotificationTemplateEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.notificationTemplatesService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('notification-templates', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an notification template by ID' })
  @ApiResponse({ status: 200, type: NotificationTemplateEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationTemplateDto: UpdateNotificationTemplateDto,
  ) {
    return await this.notificationTemplatesService.update(
      id,
      updateNotificationTemplateDto,
    );
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('notification-templates', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an notification template by ID' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.notificationTemplatesService.remove(id);
  }
}
