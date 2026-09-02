import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as reachable without the `X-API-Key` header (e.g. /health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
