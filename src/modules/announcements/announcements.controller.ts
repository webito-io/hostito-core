import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Announcement } from './entities/announcement.entity';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { OptionalAuthGuard } from 'src/common/guards/optional.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('announcements', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiCreatedResponse({ type: Announcement })
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.announcementsService.create(createAnnouncementDto);
  }

  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'List all announcements with pagination and filter',
  })
  @ApiOkResponse({ type: [Announcement] })
  async findAll(
    @Query() query: PaginationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.announcementsService.findAll(query, req.user);
  }

  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single announcement' })
  @ApiOkResponse({ type: Announcement })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.announcementsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('announcements', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an announcement' })
  @ApiOkResponse({ type: Announcement })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('announcements', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement' })
  @ApiOkResponse({
    description: 'The announcement has been successfully deleted',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }
}
