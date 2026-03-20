import { PartialType } from '@nestjs/swagger';
import { CreateNotificationTemplateDto } from './create-notification-template.dto';

export class UpdateNotificationTemplateDto extends PartialType(CreateNotificationTemplateDto) {}
