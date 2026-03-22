import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private eventEmitter: EventEmitter2,
  ) { }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const hashed = await bcrypt.hash(registerDto.password, 10);

    const defaultCurrency = await this.prisma.currency.findFirst({
      where: { isDefault: true },
    });
    if (!defaultCurrency) {
      throw new NotFoundException('Default currency not found');
    }

    const { email, firstName, lastName } = registerDto;

    /* Check if user already exists */
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) throw new UnauthorizedException('email already exists');

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    /* Create organization */
    const organization = await this.prisma.organization.create({
      data: {
        name: `${(lastName || email.split('@')[0]).trim()}'s Organization`,
        currency: { connect: { id: defaultCurrency.id } },
      },
    });

    /* Create user */
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        role: { connect: { name: 'User' } },
        organization: { connect: { id: organization.id } },
        verificationToken,
      },
    });

    this.eventEmitter.emit('auth.registered', {
      email,
      verificationToken,
      userId: user.id,
      organizationId: organization.id,
    });

    return {
      user: {
        ...user,
        password: undefined,
        verificationToken: undefined,
        resetPasswordToken: undefined,
      },
      access_token: this.signToken(
        user.id,
        user.email,
        user.roleId,
        user.organizationId,
      ),
    };
  }

  /**
   * Login a user
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return {
      user: {
        ...user,
        password: undefined,
        verificationToken: undefined,
        resetPasswordToken: undefined,
      },
      access_token: this.signToken(
        user.id,
        user.email,
        user.roleId,
        user.organizationId,
      ),
    };
  }

  private signToken(
    userId: number,
    email: string,
    roleId: number,
    organizationId: number,
  ) {
    return this.jwt.sign({
      sub: userId,
      email,
      roleId,
      organizationId,
    });
  }

  /**
   * Get user details
   */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        emailVerified: true,
        roleId: true,
        organizationId: true,
        role: {
          select: { id: true, name: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  /**
   * Reset user password
   */
  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) {
      throw new UnauthorizedException(
        'The new password must not be the same as the old one',
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    return { message: 'Password reset successful' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Password reset email sent' };

    // Simple cooldown
    if (
      user.resetPasswordExpiry &&
      user.resetPasswordExpiry.getTime() > Date.now() + 59 * 60000
    ) {
      throw new HttpException('Please wait before requesting again', 429);
    }

    const token = randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiry: new Date(Date.now() + 60 * 60000),
      },
    });

    this.eventEmitter.emit('auth.forgot-password', {
      email,
      token,
      userId: user.id,
    });

    return { message: 'Password reset email sent' };
  }

  /**
   * Verify user email
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });
    if (!user) throw new NotFoundException('Invalid verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    this.eventEmitter.emit('auth.verified', {
      email: user.email,
      firstName: user.firstName,
      userId: user.id,
      organizationId: user.organizationId,
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) return { message: 'Email already verified' };

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    this.eventEmitter.emit('auth.resend-verification', {
      email,
      verificationToken,
      userId: user.id,
    });

    return { message: 'Verification email sent' };
  }
}
