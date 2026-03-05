import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async register(email: string, password: string, firstName?: string, lastName?: string) {
        const hashed = await bcrypt.hash(password, 10);
        /* Create organization if it doesn't exist */
        const organization = await this.prisma.organization.create({
            data: { name: `${lastName ?? ''} Organization`, currency: { connect: { id: 1 } } },
        });
        const user = await this.prisma.user.create({
            data: { email, password: hashed, firstName, lastName, role: { connect: { id: 100 } }, organization: { connect: { id: organization.id } } },
        });
        return this.signToken(user.id, user.email, user.roleId);
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return this.signToken(user.id, user.email, user.roleId);
    }

    private signToken(userId: number, email: string, roleId: number) {
        return {
            access_token: this.jwt.sign({ sub: userId, email, roleId }),
        };
    }

    async getMe(userId: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');
        return user;
    }

    async resetPassword(token: string, password: string) {
        // TODO: Implement password reset logic
        throw new Error('Not implemented');
    }

    async forgotPassword(email: string) {
        // TODO: Implement forgot password logic
        throw new Error('Not implemented');
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
