import { ApiProperty } from '@nestjs/swagger';

export class EmailTemplateEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'invoice.paid' })
  name: string;

  @ApiProperty({ example: 'Your invoice has been paid' })
  subject: string;

  @ApiProperty({ example: 'Dear user, your invoice was paid successfully.' })
  body: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
