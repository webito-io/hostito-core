import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsHandler } from '../notifications/notifications.handler';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthListener {
  constructor(
    private readonly notificationsHandler: NotificationsHandler,
    private readonly auditService: AuditLogsService,
  ) {}

  @OnEvent('auth.registered')
  async handleUserRegistered(payload: {
    email: string;
    verificationToken: string;
    userId: number;
    organizationId: number;
  }) {
    await this.notificationsHandler.send({
      type: 'email',
      to: payload.email,
      template: 'verify_email',
      data: { verificationToken: payload.verificationToken },
    });

    await this.auditService.create({
      action: 'REGISTER',
      entity: 'USER',
      userId: payload.userId,
      organizationId: payload.organizationId,
      newValue: { email: payload.email },
    });
  }

  @OnEvent('auth.forgot-password')
  async handleForgotPassword(payload: {
    email: string;
    token: string;
    userId?: number;
  }) {
    await this.notificationsHandler.send({
      type: 'email',
      to: payload.email,
      template: 'reset_password',
      data: { token: payload.token },
    });

    await this.auditService.create({
      action: 'FORGOT_PASSWORD',
      entity: 'USER',
      userId: payload.userId,
      newValue: { email: payload.email },
    });
  }

  @OnEvent('auth.verified')
  async handleUserVerified(payload: {
    email: string;
    firstName: string;
    userId: number;
    organizationId: number;
  }) {
    await this.notificationsHandler.send({
      type: 'email',
      to: payload.email,
      template: 'welcome',
      data: { firstName: payload.firstName },
    });

    await this.auditService.create({
      action: 'VERIFY_EMAIL',
      entity: 'USER',
      userId: payload.userId,
      organizationId: payload.organizationId,
    });
  }

  @OnEvent('auth.resend-verification')
  async handleResendVerification(payload: {
    email: string;
    verificationToken: string;
    userId: number;
  }) {
    await this.notificationsHandler.send({
      type: 'email',
      to: payload.email,
      template: 'verify_email',
      data: { verificationToken: payload.verificationToken },
    });

    await this.auditService.create({
      action: 'RESEND_VERIFICATION',
      entity: 'USER',
      userId: payload.userId,
    });
  }
}
