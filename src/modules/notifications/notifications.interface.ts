export interface INotificationsHandler {
  send(
    notification: NotificationDto,
  ): Promise<{ status: boolean; message: string }>;
}

export interface NotificationDto {
  type: 'email' | 'sms' | 'push';
  to: string;
  template: string;
  data: Record<string, any>;
}
