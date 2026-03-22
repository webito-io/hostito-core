import { Injectable } from "@nestjs/common";
import { NotificationDto, INotificationsHandler } from "./notifications.interface";
import { NotificationFactory } from "./notifications.factory";
import { PrismaService } from "../prisma/prisma.service";
import Handlebars from 'handlebars';

@Injectable()
export class NotificationsHandler implements INotificationsHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationFactory: NotificationFactory,
    ) { }

    async send(notification: NotificationDto) {

        /* find notification drivers */
        const drivers = await this.prisma.setting.findUnique({
            where: {
                key: 'notification_drivers',
            },
        });
        if (!drivers) {
            throw new Error('Notification driver not found');
        }
        const driver = drivers.value && drivers.value[notification.type];
        if (!driver) {
            throw new Error('Notification driver not found');
        }
        const provider = this.notificationFactory.get(driver);


        /* find notification template */
        const template = await this.prisma.notificationTemplate.findUnique({
            where: {
                name: notification.template,
            },
        });
        if (!template) {
            throw new Error('Notification template not found');
        }

        const body = Handlebars.compile(template.body)(notification);
        const subject = Handlebars.compile(template.subject)(notification);

        return await provider.send({
            to: notification.to,
            subject: subject,
            body: body,
        });

    }

}