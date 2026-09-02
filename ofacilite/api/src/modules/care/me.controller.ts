import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../users/user.entity';
import { CareService } from './care.service';
import { MedicationEventDto } from './dto/medication-event.dto';
import { PutAppointmentsDto } from './dto/put-appointments.dto';
import { PutContactsDto } from './dto/put-contacts.dto';
import { PutMedicationsDto } from './dto/put-medications.dto';

/** Données de suivi de la personne connectée (appli mobile). */
@Controller('me')
export class MeController {
  constructor(private readonly care: CareService) {}

  @Get('contacts')
  contacts(@CurrentUser() me: User) {
    return this.care.listContacts(me.id);
  }

  @Put('contacts')
  replaceContacts(@CurrentUser() me: User, @Body() dto: PutContactsDto) {
    return this.care.replaceContacts(me.id, dto);
  }

  @Get('medications')
  medications(@CurrentUser() me: User) {
    return this.care.listMedications(me.id);
  }

  @Put('medications')
  replaceMedications(@CurrentUser() me: User, @Body() dto: PutMedicationsDto) {
    return this.care.replaceMedications(me.id, dto);
  }

  @Get('appointments')
  appointments(@CurrentUser() me: User) {
    return this.care.listAppointments(me.id);
  }

  @Put('appointments')
  replaceAppointments(
    @CurrentUser() me: User,
    @Body() dto: PutAppointmentsDto,
  ) {
    return this.care.replaceAppointments(me.id, dto);
  }

  @Get('medication-events')
  medicationEvents(@CurrentUser() me: User) {
    return this.care.listMedicationEvents(me.id);
  }

  @Post('medication-events')
  recordMedicationEvent(
    @CurrentUser() me: User,
    @Body() dto: MedicationEventDto,
  ) {
    return this.care.recordMedicationEvent(me.id, dto);
  }
}
