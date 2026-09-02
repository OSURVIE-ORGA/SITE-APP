import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAlert } from './alert.entity';
import { AlertsService } from './alerts.service';

/** Fournit AlertsService à qui doit lever une alerte admin (admin, care…). */
@Module({
  imports: [TypeOrmModule.forFeature([AdminAlert])],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
