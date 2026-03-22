import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import * as dotenv from 'dotenv';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from './auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { AuthListener } from './auth.listener';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

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
  providers: [AuthService, JwtStrategy, AuthGuard, AuthListener],
  exports: [PassportModule, JwtStrategy, AuthGuard],
})
export class AuthModule { }
