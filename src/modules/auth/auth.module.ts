import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as dotenv from 'dotenv';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthListener } from './auth.listener';
import { AuthService } from './auth.service';
import { GithubStrategy } from './github.strategy';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

dotenv.config();

@Module({
  imports: [
    NotificationsModule,
    AuditLogsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy, AuthGuard, AuthListener],
  exports: [PassportModule, JwtStrategy, AuthGuard],
})
export class AuthModule { }
