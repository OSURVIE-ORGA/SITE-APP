import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from '../alerts/alerts.module';
import { UsersModule } from '../users/users.module';
import { Appointment } from './appointment.entity';
import { CareService } from './care.service';
import { Contact } from './contact.entity';
import { MeController } from './me.controller';
import { MedicationEvent } from './medication-event.entity';
import { MedicationTime } from './medication-time.entity';
import { Medication } from './medication.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Medication,
      MedicationTime,
      Appointment,
      MedicationEvent,
      Contact,
    ]),
    AlertsModule,
    UsersModule,
  ],
  controllers: [MeController],
  providers: [CareService],
  exports: [CareService],
})
export class CareModule {}
