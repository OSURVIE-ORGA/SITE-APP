import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginEvent } from './login-event.entity';

export interface LoginDay {
  date: string; // YYYY-MM-DD
  count: number;
}

@Injectable()
export class LoginEventsService {
  constructor(
    @InjectRepository(LoginEvent)
    private readonly repo: Repository<LoginEvent>,
  ) {}

  record(userId: string): Promise<unknown> {
    return this.repo.save(this.repo.create({ userId }));
  }

  /** Connexions par jour sur les `days` derniers jours (jours vides à 0). */
  async perDay(days: number): Promise<LoginDay[]> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const rows = await this.repo
      .createQueryBuilder('e')
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.createdAt >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
    const out: LoginDay[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, count: map.get(key) ?? 0 });
    }
    return out;
  }
}
