import { BadRequestException, Injectable } from '@nestjs/common';
import { SmtpProvider } from './providers/smtp/smtp.provider';

@Injectable()
export class NotificationFactory {
  constructor(private readonly smtpProvider: SmtpProvider) {}

  get(provider: string) {
    switch (provider) {
      case 'smtp':
        return this.smtpProvider;
      default:
        throw new BadRequestException(
          `Unknown notification provider: ${provider}`,
        );
    }
  }
}
