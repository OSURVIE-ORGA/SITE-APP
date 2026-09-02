import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../modules/users/user.entity';

/** À appliquer après le JwtAuthGuard : réserve la route au rôle `admin`. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    if (request.user?.role !== 'admin') {
      throw new ForbiddenException('Accès réservé à l’administrateur.');
    }
    return true;
  }
}
