import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AuditLogsService } from './audit-logs.service';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';
import { AuditLog } from './entities/audit-log.entity';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('audit-logs', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'List audit logs with searching and filtering' })
  @ApiResponse({ status: 200, type: [AuditLog] })
  async findAll(@Query() query: FindAuditLogsDto) {
    return this.auditLogsService.findAll(query);
  }
}
