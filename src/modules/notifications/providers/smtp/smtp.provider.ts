import * as nodemailer from 'nodemailer';

export class SmtpProvider {
  private transport: nodemailer.Transporter;

  constructor() {
    this.transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
  }) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: subject,
        text: body,
      };

      await this.transport.sendMail(mailOptions);

      return { status: true, message: 'Email sent successfully' };
    } catch (e) {
      return { status: false, message: 'Failed to send email' };
    }
  }
}
