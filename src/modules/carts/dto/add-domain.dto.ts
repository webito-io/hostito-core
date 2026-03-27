import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddDomainDto {
  @ApiProperty({ description: 'Full domain name', example: 'example.com' })
  @IsString()
  domain: string;
}
