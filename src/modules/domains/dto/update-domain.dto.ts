import { PartialType } from '@nestjs/swagger';
import { CreateDomainDto } from './create-domain.dto';

export class UpdateDomainDto extends PartialType(CreateDomainDto) {}
