import * as nodemailer from 'nodemailer';

export class Mailer {

    private transport;

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


    async send({ email, text }: { email: string; text: string }) {

        try {

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Reset Password',
                text: text,
            };

            await this.transport.sendMail(mailOptions);

            return { status: true }

        } catch (e) {
            return { status: false }
        }

    }
}