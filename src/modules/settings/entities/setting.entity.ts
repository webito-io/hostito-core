import { ApiProperty } from '@nestjs/swagger';

export class SettingEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'site_name' })
  key: string;

  @ApiProperty({ example: 'My Hosting Company' })
  value: string;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
