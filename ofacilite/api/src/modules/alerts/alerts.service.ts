import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AdminAlert, AlertType } from './alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AdminAlert)
    private readonly repo: Repository<AdminAlert>,
  ) {}

  /** Crée une alerte, sauf s'il en existe déjà une non lue de même type
   *  pour la même personne (anti-doublon). */
  async raise(
    type: AlertType,
    userId: string | null,
    message: string,
  ): Promise<AdminAlert | null> {
    const dup = await this.repo.findOne({
      where: { type, userId: userId ?? IsNull(), readAt: IsNull() },
    });
    if (dup) return null;
    return this.repo.save(this.repo.create({ type, userId, message }));
  }

  list(includeRead = false): Promise<AdminAlert[]> {
    return this.repo.find({
      where: includeRead ? {} : { readAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  unreadCount(): Promise<number> {
    return this.repo.count({ where: { readAt: IsNull() } });
  }

  async markRead(id: string): Promise<void> {
    await this.repo.update(id, { readAt: new Date() });
  }

  async markAllRead(): Promise<void> {
    await this.repo.update({ readAt: IsNull() }, { readAt: new Date() });
  }
}
