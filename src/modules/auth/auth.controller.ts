import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationEmailDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthResponse, MessageResponse } from './auth.entity';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body.email, body.password);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    type: MessageResponse,
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    type: MessageResponse,
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.authService.resetPassword(body.token, body.password);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email using token' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successful',
    type: MessageResponse,
  })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return await this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification-email')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent',
    type: MessageResponse,
  })
  async resendVerificationEmail(@Body() body: ResendVerificationEmailDto) {
    return await this.authService.resendVerificationEmail(body.email);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Return current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req) {
    return await this.authService.getMe(req.user.id);
  }

  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  @ApiOperation({ summary: 'Start Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // This route initiates the Google OAuth flow
    // Passport will handle the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Google OAuth successful',
    type: AuthResponse,
  })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    // req.user contains the user data from GoogleStrategy
    const result = req.user;

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:7080';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}`;

    res.redirect(redirectUrl);
  }

  @Get('github')
  @UseGuards(PassportAuthGuard('github'))
  @ApiOperation({ summary: 'Start GitHub OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  async githubAuth() {
    // This route initiates the GitHub OAuth flow
    // Passport will handle the redirect to GitHub
  }

  @Get('github/callback')
  @UseGuards(PassportAuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'GitHub OAuth successful',
    type: AuthResponse,
  })
  async githubAuthCallback(@Req() req, @Res() res: Response) {
    // req.user contains the user data from GithubStrategy
    const result = req.user;

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:7080';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}`;

    res.redirect(redirectUrl);
  }
}
