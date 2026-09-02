import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { AlertsService } from './alerts.service';

const INACTIVE_DAYS = 7;

@Injectable()
export class InactivityCron {
  private readonly logger = new Logger(InactivityCron.name);

  constructor(
    private readonly users: UsersService,
    private readonly alerts: AlertsService,
  ) {}

  /** Tous les jours à 08:00 : signale les comptes inactifs depuis 7 jours. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkInactivity(): Promise<void> {
    const stale = await this.users.inactiveUsers(INACTIVE_DAYS);
    let raised = 0;
    for (const u of stale) {
      const last = u.lastSeenAt
        ? `vu pour la dernière fois le ${u.lastSeenAt.toISOString().slice(0, 10)}`
        : 'jamais connecté';
      const alert = await this.alerts.raise(
        'user_inactive',
        u.id,
        `${u.firstName} ${u.lastName} est inactif depuis plus de ${INACTIVE_DAYS} jours (${last}).`,
      );
      if (alert) raised++;
    }
    this.logger.log(
      `Inactivité : ${stale.length} compte(s) concerné(s), ${raised} nouvelle(s) alerte(s).`,
    );
  }
}
