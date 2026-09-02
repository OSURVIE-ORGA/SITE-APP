import type { Appointment } from './appointment.entity';
import type { Contact } from './contact.entity';
import type { MedicationEvent } from './medication-event.entity';
import type { Medication } from './medication.entity';

export interface MedicationTimeView {
  hour: number;
  minute: number;
}

export interface MedicationView {
  id: string;
  name: string;
  startDate: string | null;
  durationDays: number | null;
  /** Date de fin calculée (YYYY-MM-DD) si startDate + durationDays. */
  endDate: string | null;
  times: MedicationTimeView[];
  updatedAt: string;
}

export interface AppointmentView {
  id: string;
  title: string;
  doctorName: string;
  scheduledAt: string;
  updatedAt: string;
}

export interface MedicationEventView {
  id: string;
  medicationName: string;
  status: 'taken' | 'missed';
  reportedAt: string;
}

export interface ContactView {
  id: string;
  name: string;
  phone: string;
  updatedAt: string;
}

function endDateOf(
  startDate: string | null,
  durationDays: number | null,
): string | null {
  if (!startDate || !durationDays || durationDays <= 0) return null;
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + durationDays);
  return d.toISOString().slice(0, 10);
}

export function toMedicationView(m: Medication): MedicationView {
  const times = [...(m.times ?? [])]
    .map((t) => ({ hour: t.hour, minute: t.minute }))
    .sort((a, b) => a.hour - b.hour || a.minute - b.minute);
  return {
    id: m.id,
    name: m.name,
    startDate: m.startDate,
    durationDays: m.durationDays,
    endDate: endDateOf(m.startDate, m.durationDays),
    times,
    updatedAt: m.updatedAt.toISOString(),
  };
}

export function toAppointmentView(a: Appointment): AppointmentView {
  return {
    id: a.id,
    title: a.title,
    doctorName: a.doctorName,
    scheduledAt: a.scheduledAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function toMedicationEventView(e: MedicationEvent): MedicationEventView {
  return {
    id: e.id,
    medicationName: e.medicationName,
    status: e.status,
    reportedAt: e.reportedAt.toISOString(),
  };
}

export function toContactView(c: Contact): ContactView {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    updatedAt: c.updatedAt.toISOString(),
  };
}
