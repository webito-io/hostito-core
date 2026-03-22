import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { SettingEntity } from './entities/setting.entity';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('settings', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all settings (Admin only)' })
  @ApiResponse({ status: 200, type: [SettingEntity] })
  async get() {
    return await this.settingsService.get();
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public settings (Unauthenticated)' })
  @ApiResponse({ status: 200, description: 'Key-Value pair object of public settings' })
  async getPublic() {
    return await this.settingsService.getPublic();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('settings', 'update', 'all')
  @Patch(':key')
  @ApiOperation({ summary: 'Update or create a setting by its key' })
  @ApiResponse({ status: 200, type: SettingEntity })
  async update(@Param('key') key: string, @Body() updateSettingDto: UpdateSettingDto) {
    return await this.settingsService.update(key, updateSettingDto);
  }
}
