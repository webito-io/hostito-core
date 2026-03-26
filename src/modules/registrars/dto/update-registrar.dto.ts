import { PartialType } from '@nestjs/swagger';
import { CreateRegistrarDto } from './create-registrar.dto';

export class UpdateRegistrarDto extends PartialType(CreateRegistrarDto) {}
