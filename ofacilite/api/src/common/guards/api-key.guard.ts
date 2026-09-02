import { createHash, timingSafeEqual } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Every route requires the shared `X-API-Key` header, except those marked
 * `@Public()`. The mobile app holds the key; this keeps anonymous callers off
 * the (paid) Mistral endpoints. It is a coarse gate, not user auth.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly expectedDigest: Buffer;

  constructor(
    private readonly reflector: Reflector,
    configService: ConfigService,
  ) {
    // Hash both sides to a fixed 32 bytes so timingSafeEqual never throws on a
    // length mismatch and the comparison leaks nothing about the key length.
    this.expectedDigest = createHash('sha256')
      .update(configService.getOrThrow<string>('API_KEY'))
      .digest();
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.header('x-api-key');
    if (!header) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const providedDigest = createHash('sha256').update(header).digest();
    if (!timingSafeEqual(providedDigest, this.expectedDigest)) {
      throw new UnauthorizedException('Invalid X-API-Key');
    }
    return true;
  }
}
