import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService, GithubUser } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { username, emails, photos, id } = profile;

    // GitHub may not always provide email, try to get from emails array
    const email = emails?.[0]?.value;

    const user: GithubUser = {
      githubId: id,
      email,
      firstName: profile.name?.givenName || username,
      lastName: profile.name?.familyName,
      picture: photos?.[0]?.value,
      accessToken,
    };

    // Find or create user in database
    const existingUser = await this.authService.findOrCreateUserWithGithub(user);

    return existingUser;
  }
}