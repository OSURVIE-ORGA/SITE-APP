import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { UsersService } from '../users/users.service';
import { Message } from './message.entity';
import { MessageView, ThreadView, toMessageView } from './message-view';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly repo: Repository<Message>,
    private readonly users: UsersService,
    private readonly alerts: AlertsService,
  ) {}

  // ── Côté personne (appli mobile) ──────────────────────────────
  async listForUser(userId: string): Promise<MessageView[]> {
    const messages = await this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    await this.repo.update(
      { userId, fromAdmin: true, readAt: IsNull() },
      { readAt: new Date() },
    );
    return messages.map(toMessageView);
  }

  async sendFromUser(userId: string, body: string): Promise<MessageView> {
    const message = await this.repo.save(
      this.repo.create({
        userId,
        fromAdmin: false,
        authorId: userId,
        body: body.trim(),
      }),
    );
    const user = await this.users.findById(userId);
    const who = user ? `${user.firstName} ${user.lastName}` : 'Une personne';
    await this.alerts.raise(
      'new_message',
      userId,
      `${who} vous a envoyé un message.`,
    );
    return toMessageView(message);
  }

  unreadForUser(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, fromAdmin: true, readAt: IsNull() },
    });
  }

  // ── Côté admin (dashboard) ───────────────────────────────────
  async listThreads(): Promise<ThreadView[]> {
    const grouped = (await this.repo
      .createQueryBuilder('m')
      .select('m.userId', 'userId')
      .addSelect('MAX(m.createdAt)', 'lastAt')
      .groupBy('m.userId')
      .orderBy('MAX(m.createdAt)', 'DESC')
      .getRawMany()) as { userId: string }[];

    const threads: ThreadView[] = [];
    for (const { userId } of grouped) {
      const [last, unread, user] = await Promise.all([
        this.repo.findOne({ where: { userId }, order: { createdAt: 'DESC' } }),
        this.repo.count({
          where: { userId, fromAdmin: false, readAt: IsNull() },
        }),
        this.users.findById(userId),
      ]);
      if (!last || !user) continue;
      threads.push({
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        lastMessage: last.body.slice(0, 140),
        lastAt: last.createdAt.toISOString(),
        lastFromAdmin: last.fromAdmin,
        unread,
      });
    }
    return threads;
  }

  async threadForAdmin(userId: string): Promise<MessageView[]> {
    const messages = await this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    await this.repo.update(
      { userId, fromAdmin: false, readAt: IsNull() },
      { readAt: new Date() },
    );
    await this.alerts.dismiss('new_message', userId);
    return messages.map(toMessageView);
  }

  async sendFromAdmin(
    userId: string,
    adminId: string,
    body: string,
  ): Promise<MessageView> {
    const message = await this.repo.save(
      this.repo.create({
        userId,
        fromAdmin: true,
        authorId: adminId,
        body: body.trim(),
      }),
    );
    return toMessageView(message);
  }

  unreadForAdmin(): Promise<number> {
    return this.repo.count({ where: { fromAdmin: false, readAt: IsNull() } });
  }
}
