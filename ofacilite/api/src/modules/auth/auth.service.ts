import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { toUserView, UserView } from '../users/user-view';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(loginCode: string): Promise<{ token: string; user: UserView }> {
    const user = await this.users.findByLoginCode(loginCode);
    if (!user || user.disabled) {
      throw new UnauthorizedException('Numéro inconnu ou compte désactivé.');
    }
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const token = await this.jwt.signAsync(payload);
    await this.users.markLoggedIn(user.id);
    user.lastLoginAt = new Date();
    user.lastSeenAt = user.lastLoginAt;
    return { token, user: toUserView(user) };
  }
}
