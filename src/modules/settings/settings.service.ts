import { Injectable } from '@nestjs/common';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {

  constructor(private readonly prisma: PrismaService) { }

  async get() {
    return await this.prisma.setting.findMany();
  }

  async getPublic() {
    const settings = await this.prisma.setting.findMany({
      where: {
        isPublic: true
      }
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  async update(key: string, updateSettingDto: UpdateSettingDto) {
    return await this.prisma.setting.upsert({
      where: {
        key
      },
      update: {
        value: updateSettingDto.value,
        isPublic: updateSettingDto.isPublic,
      },
      create: {
        key: key,
        value: updateSettingDto.value,
        isPublic: updateSettingDto.isPublic ?? false,
      }
    });
  }
}
