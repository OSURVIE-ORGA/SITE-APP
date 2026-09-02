import type { UserRole } from '../users/user.entity';

export interface JwtPayload {
  /** user id */
  sub: string;
  role: UserRole;
}
