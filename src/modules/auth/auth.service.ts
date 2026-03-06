import { HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Mailer } from 'src/common/mailer/mailer.setup';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const hashed = await bcrypt.hash(registerDto.password, 10);

        // TODO: Organization invite code for user

        /* Create organization if it doesn't exist */
        const organization = await this.prisma.organization.create({
            data: { name: `${(registerDto.lastName || registerDto.email.split('@')[0]).trim()}'s Organization`, currency: { connect: { id: 1 } } },
        });

        const { email, firstName, lastName } = registerDto;

        /* Create user */
        const user = await this.prisma.user.create({
            data: {
                email: email,
                password: hashed,
                firstName: firstName,
                lastName: lastName,
                role: { connect: { id: 100 } },
                organization: { connect: { id: organization.id } }
            },
        });

        return this.signToken(user.id, user.email, user.roleId, user.organizationId);
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return this.signToken(user.id, user.email, user.roleId, user.organizationId);
    }

    private signToken(userId: number, email: string, roleId: number, organizationId: number) {
        return {
            access_token: this.jwt.sign({ sub: userId, email, roleId, organizationId }),
        };
    }

    async getMe(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!user) throw new UnauthorizedException('User not found');
        return user;
    }

    async resetPassword(token: string, password: string) {

        let payload: { email?: string; type?: string };
        try {
            payload = this.jwt.verify(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const user = await this.prisma.user.findUnique({ where: { email: payload.email } });
        if (!user) throw new NotFoundException('User not found');

        const hashed = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashed },
        });

        return { message: 'Password reset successful' };
    }

    async forgotPassword(email: string) {
        // TODO: Implement forgot password logic

        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException('User not found');

        // TODO: use email templates and a service to send emails
        const mailer = new Mailer();
        const token = this.jwt.sign({ email, type: 'reset-password' }, { expiresIn: '1h' });

        const sendMail = await mailer.send({
            email,
            text: `Click the link below to reset your password: ${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`,
            // template: 'reset-password'
        });
        
        if (!sendMail.status) {
            throw new HttpException('Email system', 500)
        }

        return { message: 'Password reset email sent' };
    }

    async verifyEmail(token: string) {
        // TODO: Implement email verification logic
        throw new Error('Not implemented');
    }

    async resendVerificationEmail(email: string) {
        // TODO: Implement resend verification email logic
        throw new Error('Not implemented');
    }
}
