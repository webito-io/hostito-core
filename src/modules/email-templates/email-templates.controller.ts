import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateEntity } from './entities/email-template.entity';

@ApiTags('Email Templates')
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('email-templates', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new email template' })
  @ApiResponse({ status: 201, type: EmailTemplateEntity })
  async create(@Body() createEmailTemplateDto: CreateEmailTemplateDto) {
    return await this.emailTemplatesService.create(createEmailTemplateDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('email-templates', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all email templates' })
  @ApiResponse({ status: 200, type: [EmailTemplateEntity] })
  async findAll(@Query() query: PaginationDto) {
    return await this.emailTemplatesService.findAll(query);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('email-templates', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get an email template by ID' })
  @ApiResponse({ status: 200, type: EmailTemplateEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.emailTemplatesService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('email-templates', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an email template by ID' })
  @ApiResponse({ status: 200, type: EmailTemplateEntity })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateEmailTemplateDto: UpdateEmailTemplateDto) {
    return await this.emailTemplatesService.update(id, updateEmailTemplateDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('email-templates', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an email template by ID' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.emailTemplatesService.remove(id);
  }
}
