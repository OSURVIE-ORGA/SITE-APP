import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { LoginEventsModule } from '../login-events/login-events.module';
import { AdminController } from './admin.controller';
import { AdminAlert } from './alert.entity';
import { AlertsService } from './alerts.service';
import { InactivityCron } from './inactivity.cron';

@Module({
  imports: [
    UsersModule,
    LoginEventsModule,
    TypeOrmModule.forFeature([AdminAlert]),
  ],
  controllers: [AdminController],
  providers: [AlertsService, InactivityCron],
})
export class AdminModule {}
