import { Injectable } from '@nestjs/common';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    return this.prisma.setting.findMany();
  }

  async getPublic() {
    const settings = await this.prisma.setting.findMany({
      where: {
        isPublic: true,
      },
    });

    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  async update(key: string, updateSettingDto: UpdateSettingDto) {
    return this.prisma.setting.upsert({
      where: {
        key,
      },
      update: {
        value: updateSettingDto.value as Prisma.InputJsonValue,
        isPublic: updateSettingDto.isPublic,
      },
      create: {
        key: key,
        value: updateSettingDto.value as Prisma.InputJsonValue,
        isPublic: updateSettingDto.isPublic ?? false,
      },
    });
  }
}
