import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './auth.dto';

export interface GoogleUser {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken: string;
}

export interface GithubUser {
  githubId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private eventEmitter: EventEmitter2,
  ) {}

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

    /* Resolve default role from settings */
    const defaultRoleSetting = await this.prisma.setting.findUnique({
      where: { key: 'default_role' },
    });
    if (!defaultRoleSetting) {
      throw new NotFoundException('Default role setting not found');
    }
    const defaultRoleId = defaultRoleSetting.value as number;

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
        role: { connect: { id: defaultRoleId } },
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

    if (!user.password)
      throw new UnauthorizedException('Please use OAuth to login');

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
          select: { id: true, name: true, currency: true },
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

    if (!user.password)
      throw new UnauthorizedException('Please use OAuth to login');

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

  /**
   * Find or create user with Google OAuth
   */
  async findOrCreateUserWithGoogle(googleUser: GoogleUser) {
    const { googleId, email, firstName, lastName } = googleUser;

    // Check if user exists by googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      // Check if user exists by email
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      } else {
        // Create new user with Google OAuth
        const defaultCurrency = await this.prisma.currency.findFirst({
          where: { isDefault: true },
        });
        if (!defaultCurrency) {
          throw new NotFoundException('Default currency not found');
        }

        const defaultRoleSetting = await this.prisma.setting.findUnique({
          where: { key: 'default_role' },
        });
        if (!defaultRoleSetting) {
          throw new NotFoundException('Default role setting not found');
        }
        const defaultRoleId = defaultRoleSetting.value as number;

        // Create organization
        const organization = await this.prisma.organization.create({
          data: {
            name: `${(lastName || email.split('@')[0]).trim()}'s Organization`,
            currency: { connect: { id: defaultCurrency.id } },
          },
        });

        // Create user
        user = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            googleId,
            role: { connect: { id: defaultRoleId } },
            organization: { connect: { id: organization.id } },
            emailVerified: true, // Google verified email
          },
        });

        // Update user with organization currencyId
        await this.prisma.organization.update({
          where: { id: organization.id },
          data: { currencyId: defaultCurrency.id },
        });
      }
    }

    // Generate JWT token
    const token = this.signToken(
      user.id,
      user.email,
      user.roleId,
      user.organizationId,
    );

    return {
      user: {
        ...user,
        password: undefined,
        verificationToken: undefined,
        resetPasswordToken: undefined,
      },
      access_token: token,
    };
  }

  /**
   * Find or create user with GitHub OAuth
   */
  async findOrCreateUserWithGithub(githubUser: GithubUser) {
    const { githubId, email, firstName, lastName } = githubUser;

    // GitHub OAuth requires email - if not provided, throw error
    if (!email) {
      throw new UnauthorizedException(
        'GitHub email not available. Please make your email public in GitHub settings.',
      );
    }

    // Check if user exists by githubId
    let user = await this.prisma.user.findUnique({
      where: { githubId },
    });

    if (!user) {
      // Check if user exists by email
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link GitHub account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { githubId },
        });
      } else {
        // Create new user with GitHub OAuth
        const defaultCurrency = await this.prisma.currency.findFirst({
          where: { isDefault: true },
        });
        if (!defaultCurrency) {
          throw new NotFoundException('Default currency not found');
        }

        const defaultRoleSetting = await this.prisma.setting.findUnique({
          where: { key: 'default_role' },
        });
        if (!defaultRoleSetting) {
          throw new NotFoundException('Default role setting not found');
        }
        const defaultRoleId = defaultRoleSetting.value as number;

        // Create organization
        const organization = await this.prisma.organization.create({
          data: {
            name: `${(lastName || email.split('@')[0]).trim()}'s Organization`,
            currency: { connect: { id: defaultCurrency.id } },
          },
        });

        // Create user
        user = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            githubId,
            role: { connect: { id: defaultRoleId } },
            organization: { connect: { id: organization.id } },
            emailVerified: true, // GitHub verified email
          },
        });

        // Update user with organization currencyId
        await this.prisma.organization.update({
          where: { id: organization.id },
          data: { currencyId: defaultCurrency.id },
        });
      }
    }

    // Generate JWT token
    const token = this.signToken(
      user.id,
      user.email,
      user.roleId,
      user.organizationId,
    );

    return {
      user: {
        ...user,
        password: undefined,
        verificationToken: undefined,
        resetPasswordToken: undefined,
      },
      access_token: token,
    };
  }
}
