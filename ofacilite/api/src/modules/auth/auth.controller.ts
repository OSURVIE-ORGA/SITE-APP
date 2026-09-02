import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../users/user.entity';
import { toUserView } from '../users/user-view';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

export const SESSION_COOKIE = 'session';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: NINETY_DAYS_MS,
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.loginCode);
    // Cookie httpOnly pour le dashboard ; le corps sert au client mobile.
    res.cookie(SESSION_COOKIE, result.token, this.cookieOptions());
    return result;
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, {
      ...this.cookieOptions(),
      maxAge: undefined,
    });
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return toUserView(user);
  }
}
