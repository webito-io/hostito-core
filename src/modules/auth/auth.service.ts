import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Mailer } from 'src/common/mailer/mailer.setup';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) { }

  /**
   * Register a new user
   * @param registerDto
   * @returns
   */
  async register(registerDto: RegisterDto) {
    const hashed = await bcrypt.hash(registerDto.password, 10);

    // TODO: Organization invite code for user

    /* Create organization if it doesn't exist */
    const defaultCurrency = await this.prisma.currency.findFirst({
      where: { isDefault: true },
    });
    if (!defaultCurrency) {
      throw new NotFoundException('Default currency not found');
    }
    const organization = await this.prisma.organization.create({
      data: {
        name: `${(registerDto.lastName || registerDto.email.split('@')[0]).trim()}'s Organization`,
        currency: { connect: { id: defaultCurrency.id } },
      },
    });

    const { email, firstName, lastName } = registerDto;

    /* Check if user already exists */
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) throw new UnauthorizedException('email already exists');

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    /* Create user */
    const user = await this.prisma.user.create({
      data: {
        email: email,
        password: hashed,
        firstName: firstName,
        lastName: lastName,
        role: { connect: { name: 'User' } },
        organization: { connect: { id: organization.id } },
        verificationToken,
      },
    });

    const mailer = new Mailer();
    await mailer.send({
      email,
      text: `Your verification code is: ${verificationToken}`,
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
   * @param email
   * @param password
   * @returns
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

  /**
   * Sign a JWT token
   * @param userId
   * @param email
   * @param roleId
   * @param organizationId
   * @returns
   */
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
   * @param userId
   * @returns
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

  /**
   * Reset user password
   * @param token
   * @param password
   * @returns
   */
  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { gt: new Date() }
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) {
      throw new UnauthorizedException('The new password must not be the same as the old one');
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
    if (user.resetPasswordExpiry && user.resetPasswordExpiry.getTime() > Date.now() + 59 * 60000) {
      throw new HttpException('Please wait before requesting again', 429);
    }

    const token = randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiry: new Date(Date.now() + 60 * 60000), // 1 hour
      },
    });

    const mailer = new Mailer();

    const sendMail = await mailer.send({
      email,
      text: `Click the link below to  reset your password: ${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`,
    });

    if (!sendMail.status) {
      throw new HttpException('Email system error', 500);
    }

    return { message: 'Password reset email sent' };
  }

  /**
   * Verify user email
   * @param token
   * @returns
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

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   * @param email
   * @returns
   */
  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) return { message: 'Email already verified' };

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    const mailer = new Mailer();
    const sendMail = await mailer.send({
      email,
      text: `Your verification code is: ${verificationToken}`,
    });

    if (!sendMail.status) {
      throw new HttpException('Email system', 500);
    }

    return { message: 'Verification email sent' };
  }
}
