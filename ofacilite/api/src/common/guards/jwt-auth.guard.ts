import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../../modules/auth/jwt-payload';
import { UsersService } from '../../modules/users/users.service';

/**
 * Chaque route exige un JWT `Authorization: Bearer <token>` (émis par
 * /auth/login), sauf celles marquées `@Public()`. Remplace l'ancienne clé
 * partagée X-API-Key.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { cookies?: Record<string, string> }>();
    const header = request.header('authorization');
    const token =
      (header?.startsWith('Bearer ') ? header.slice(7) : null) ??
      request.cookies?.session ??
      null;
    if (!token) {
      throw new UnauthorizedException('Jeton de connexion manquant.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré.');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || user.disabled) {
      throw new UnauthorizedException('Compte introuvable ou désactivé.');
    }

    // "Touch" au plus une fois par heure — sert au suivi d'activité côté admin.
    const seen = user.lastSeenAt?.getTime() ?? 0;
    if (Date.now() - seen > 3_600_000) {
      void this.users.touchLastSeen(user.id);
    }

    (request as Request & { user: typeof user }).user = user;
    return true;
  }
}
