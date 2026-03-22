import { ApiProperty } from '@nestjs/swagger';

export class CheckDomainDto {
  @ApiProperty({ example: 'example.com' })
  domain: string;

  @ApiProperty({ example: true })
  available: boolean;
}
