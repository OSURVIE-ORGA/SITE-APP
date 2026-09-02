import { randomInt } from 'crypto';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { User } from './user.entity';

export interface UserStats {
  total: number;
  active: number;
  disabled: number;
  seenLast7d: number;
  seenLast30d: number;
  neverConnected: number;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  language?: string;
  notes?: string | null;
}

export type UpdateUserInput = Partial<CreateUserInput> & { disabled?: boolean };

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  /** Crée le compte admin au premier démarrage s'il n'existe pas encore. */
  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.repo.findOne({ where: { role: 'admin' } });
    if (existing) return;

    const loginCode = this.config.getOrThrow<string>('ADMIN_LOGIN_CODE');
    await this.repo.save(
      this.repo.create({
        loginCode,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'OFacilit',
        language: 'fr',
      }),
    );
    this.logger.log(`Compte admin créé (loginCode = ${loginCode}).`);
  }

  findByLoginCode(loginCode: string): Promise<User | null> {
    return this.repo.findOne({ where: { loginCode } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  list(): Promise<User[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = this.repo.create({
      ...input,
      email: input.email ?? null,
      phone: input.phone ?? null,
      birthDate: input.birthDate ?? null,
      notes: input.notes ?? null,
      language: input.language ?? 'fr',
      role: 'user',
      loginCode: await this.generateUniqueLoginCode(),
    });
    return this.repo.save(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.requireUser(id);
    Object.assign(user, input);
    return this.repo.save(user);
  }

  async regenerateLoginCode(id: string): Promise<User> {
    const user = await this.requireUser(id);
    user.loginCode = await this.generateUniqueLoginCode();
    return this.repo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.requireUser(id);
    if (user.role === 'admin') {
      throw new NotFoundException('Le compte admin ne peut pas être supprimé.');
    }
    await this.repo.remove(user);
  }

  markLoggedIn(id: string): Promise<unknown> {
    const now = new Date();
    return this.repo.update(id, { lastLoginAt: now, lastSeenAt: now });
  }

  /** "Touch" léger sur chaque appel authentifié (appelé throttlé par le guard). */
  touchLastSeen(id: string): Promise<unknown> {
    return this.repo.update(id, { lastSeenAt: new Date() });
  }

  async stats(): Promise<UserStats> {
    const now = Date.now();
    const d7 = new Date(now - 7 * 864e5);
    const d30 = new Date(now - 30 * 864e5);
    const [total, disabled, seenLast7d, seenLast30d, neverConnected] =
      await Promise.all([
        this.repo.count(),
        this.repo.count({ where: { disabled: true } }),
        this.repo.count({ where: { lastSeenAt: MoreThanOrEqual(d7) } }),
        this.repo.count({ where: { lastSeenAt: MoreThanOrEqual(d30) } }),
        this.repo.count({
          where: { lastSeenAt: IsNull(), role: Not('admin') },
        }),
      ]);
    return {
      total,
      active: total - disabled,
      disabled,
      seenLast7d,
      seenLast30d,
      neverConnected,
    };
  }

  /** Comptes utilisateurs (hors admin) inactifs depuis `days` jours. */
  async inactiveUsers(days: number): Promise<User[]> {
    const threshold = new Date(Date.now() - days * 864e5);
    const stale = await this.repo.find({
      where: {
        role: Not('admin'),
        disabled: false,
        lastSeenAt: LessThan(threshold),
      },
    });
    const never = await this.repo.find({
      where: {
        role: Not('admin'),
        disabled: false,
        lastSeenAt: IsNull(),
        createdAt: LessThan(threshold),
      },
    });
    return [...stale, ...never];
  }

  private async requireUser(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Compte introuvable.');
    return user;
  }

  private async generateUniqueLoginCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = String(randomInt(10_000_000, 100_000_000)); // 8 chiffres
      if (!(await this.repo.exists({ where: { loginCode: code } }))) {
        return code;
      }
    }
    throw new Error('Impossible de générer un numéro de connexion unique.');
  }
}
