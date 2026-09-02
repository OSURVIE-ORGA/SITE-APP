import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { UsersService } from '../users/users.service';
import { Appointment } from './appointment.entity';
import {
  AppointmentView,
  ContactView,
  MedicationEventView,
  MedicationView,
  toAppointmentView,
  toContactView,
  toMedicationEventView,
  toMedicationView,
} from './care-views';
import { Contact } from './contact.entity';
import { MedicationEvent } from './medication-event.entity';
import { MedicationTime } from './medication-time.entity';
import { Medication } from './medication.entity';
import { MedicationEventDto } from './dto/medication-event.dto';
import { PutAppointmentsDto } from './dto/put-appointments.dto';
import { PutContactsDto } from './dto/put-contacts.dto';
import { PutMedicationsDto } from './dto/put-medications.dto';

@Injectable()
export class CareService {
  private readonly logger = new Logger(CareService.name);

  constructor(
    @InjectRepository(Medication)
    private readonly medRepo: Repository<Medication>,
    @InjectRepository(MedicationTime)
    private readonly timeRepo: Repository<MedicationTime>,
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(MedicationEvent)
    private readonly eventRepo: Repository<MedicationEvent>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    private readonly alerts: AlertsService,
    private readonly users: UsersService,
  ) {}

  // ── Contacts ─────────────────────────────────────────────────
  async listContacts(userId: string): Promise<ContactView[]> {
    const contacts = await this.contactRepo.find({
      where: { userId },
      order: { name: 'ASC' },
    });
    return contacts.map(toContactView);
  }

  /** Remplace tout le carnet de contacts de la personne. */
  async replaceContacts(
    userId: string,
    dto: PutContactsDto,
  ): Promise<ContactView[]> {
    await this.contactRepo.delete({ userId });
    const rows = dto.contacts.map((c) =>
      this.contactRepo.create({
        userId,
        name: c.name.trim(),
        phone: c.phone.trim(),
      }),
    );
    if (rows.length) await this.contactRepo.save(rows);
    return this.listContacts(userId);
  }

  // ── Traitements ────────────────────────────────────────────────
  async listMedications(userId: string): Promise<MedicationView[]> {
    const meds = await this.medRepo.find({
      where: { userId },
      order: { name: 'ASC' },
    });
    return meds.map(toMedicationView);
  }

  /** Remplace tout l'instantané des traitements de la personne. */
  async replaceMedications(
    userId: string,
    dto: PutMedicationsDto,
  ): Promise<MedicationView[]> {
    await this.medRepo.delete({ userId });
    const rows = dto.medications.map((m) =>
      this.medRepo.create({
        userId,
        name: m.name.trim(),
        startDate: m.startDate ? m.startDate.slice(0, 10) : null,
        durationDays: m.durationDays ?? null,
        times: m.times.map((t) =>
          this.timeRepo.create({ hour: t.hour, minute: t.minute }),
        ),
      }),
    );
    if (rows.length) await this.medRepo.save(rows);
    return this.listMedications(userId);
  }

  // ── Rendez-vous ───────────────────────────────────────────────
  async listAppointments(userId: string): Promise<AppointmentView[]> {
    const appts = await this.apptRepo.find({
      where: { userId },
      order: { scheduledAt: 'ASC' },
    });
    return appts.map(toAppointmentView);
  }

  /** Remplace tout l'instantané des rendez-vous de la personne. */
  async replaceAppointments(
    userId: string,
    dto: PutAppointmentsDto,
  ): Promise<AppointmentView[]> {
    await this.apptRepo.delete({ userId });
    const rows = dto.appointments.map((a) =>
      this.apptRepo.create({
        userId,
        title: a.title.trim(),
        doctorName: (a.doctorName ?? '').trim(),
        scheduledAt: new Date(a.scheduledAt),
      }),
    );
    if (rows.length) await this.apptRepo.save(rows);
    return this.listAppointments(userId);
  }

  // ── Prises de médicaments ─────────────────────────────────────
  async listMedicationEvents(
    userId: string,
    limit = 50,
  ): Promise<MedicationEventView[]> {
    const events = await this.eventRepo.find({
      where: { userId },
      order: { reportedAt: 'DESC' },
      take: limit,
    });
    return events.map(toMedicationEventView);
  }

  /** Enregistre la réponse au rappel ; si « missed », lève une alerte admin. */
  async recordMedicationEvent(
    userId: string,
    dto: MedicationEventDto,
  ): Promise<MedicationEventView> {
    const event = await this.eventRepo.save(
      this.eventRepo.create({
        userId,
        medicationName: dto.medicationName.trim(),
        status: dto.status,
      }),
    );

    if (dto.status === 'missed') {
      const user = await this.users.findById(userId);
      const who = user ? `${user.firstName} ${user.lastName}` : 'Une personne';
      const when = event.reportedAt.toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      await this.alerts.raise(
        'medication_missed',
        userId,
        `${who} a indiqué ne pas avoir pris « ${event.medicationName} » (signalé le ${when}).`,
      );
      this.logger.warn(`Prise manquée : ${who} — ${event.medicationName}`);
    }

    return toMedicationEventView(event);
  }
}
