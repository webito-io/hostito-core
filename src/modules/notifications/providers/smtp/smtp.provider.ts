import * as nodemailer from 'nodemailer';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export class SmtpProvider {
  async send({
    config,
    to,
    subject,
    body,
  }: {
    config: SmtpConfig;
    to: string;
    subject: string;
    body: string;
  }) {
    try {
      const transport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        auth: {
          user: config.user,
          pass: config.password,
        },
      });

      await transport.sendMail({
        from: config.from,
        to,
        subject,
        text: body,
      });

      return { status: true, message: 'Email sent successfully' };
    } catch {
      return { status: false, message: 'Failed to send email' };
    }
  }
}
