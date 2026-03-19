import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'invoice.paid' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Your invoice has been paid' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Dear user, your invoice was paid successfully.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
