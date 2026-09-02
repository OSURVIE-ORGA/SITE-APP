import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { LoginEventsModule } from '../login-events/login-events.module';
import { AlertsModule } from '../alerts/alerts.module';
import { CareModule } from '../care/care.module';
import { AdminController } from './admin.controller';
import { InactivityCron } from './inactivity.cron';

@Module({
  imports: [UsersModule, LoginEventsModule, AlertsModule, CareModule],
  controllers: [AdminController],
  providers: [InactivityCron],
})
export class AdminModule {}
