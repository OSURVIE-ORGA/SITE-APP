import * as SQLite from 'expo-sqlite';

export interface Medication {
  id: number;
  name: string;
  photoPath: string | null;
  notificationId: string;
  startDate?: number;
  durationDays?: number;
}

export interface MedicationTime {
  id: number;
  medicationId: number;
  hour: number;
  minute: number;
}

export interface MedicationWithTimes {
  medication: Medication;
  times: MedicationTime[];
}

export interface Appointment {
  id: number;
  title: string;
  doctorName: string;
  scheduledAt: number; // timestamp ms
  notificationId: string;
}

export interface AppContact {
  id: string;
  name: string;
  phone: string;
  photoPath: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('ofacilite_db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      photo_path TEXT
    );
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      photo_path TEXT,
      notification_id TEXT NOT NULL DEFAULT '',
      start_date INTEGER,
      duration_days INTEGER
    );
    CREATE TABLE IF NOT EXISTS medication_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER NOT NULL,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      notification_id TEXT NOT NULL DEFAULT ''
    );
  `);

  try { await db.execAsync('ALTER TABLE medications ADD COLUMN start_date INTEGER;'); } catch (e) {}
  try { await db.execAsync('ALTER TABLE medications ADD COLUMN duration_days INTEGER;'); } catch (e) {}

  return db;
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function getContacts(): Promise<AppContact[]> {
  const database = await getDb();
  return database.getAllAsync<AppContact>(
    'SELECT id, name, phone, photo_path as photoPath FROM contacts'
  );
}

export async function addContact(id: string, name: string, phone: string, photoPath: string | null): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO contacts (id, name, phone, photo_path) VALUES (?, ?, ?, ?)',
    [id, name, phone, photoPath],
  );
}

export async function updateContactPhoto(id: string, photoPath: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE contacts SET photo_path = ? WHERE id = ?',
    [photoPath, id],
  );
}

export async function updateContact(
  id: string,
  name: string,
  phone: string,
  photoPath: string | null,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE contacts SET name = ?, phone = ?, photo_path = ? WHERE id = ?',
    [name, phone, photoPath, id],
  );
}

export async function deleteContact(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM contacts WHERE id = ?', [id]);
}

// ── Medications ───────────────────────────────────────────────────────────────

export async function getMedicationsWithTimes(): Promise<MedicationWithTimes[]> {
  const database = await getDb();
  const meds = await database.getAllAsync<Medication>(
    'SELECT id, name, photo_path as photoPath, notification_id as notificationId, start_date as startDate, duration_days as durationDays FROM medications',
  );
  const result: MedicationWithTimes[] = [];
  for (const med of meds) {
    const times = await database.getAllAsync<MedicationTime>(
      'SELECT id, medication_id as medicationId, hour, minute FROM medication_times WHERE medication_id = ?',
      [med.id],
    );
    result.push({ medication: med, times });
  }
  return result;
}

export async function addMedication(
  name: string,
  photoPath: string | null,
  notificationId: string,
  startDate?: number,
  durationDays?: number,
): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO medications (name, photo_path, notification_id, start_date, duration_days) VALUES (?, ?, ?, ?, ?)',
    [name, photoPath, notificationId, startDate || null, durationDays || null],
  );
  return result.lastInsertRowId;
}

export async function updateMedicationNotificationId(id: number, notificationId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE medications SET notification_id = ? WHERE id = ?',
    [notificationId, id],
  );
}

export async function addMedicationTime(medicationId: number, hour: number, minute: number): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO medication_times (medication_id, hour, minute) VALUES (?, ?, ?)',
    [medicationId, hour, minute],
  );
  return result.lastInsertRowId;
}

export async function updateMedication(
  id: number,
  name: string,
  photoPath: string | null,
  durationDays?: number
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE medications SET name = ?, photo_path = ?, duration_days = ? WHERE id = ?',
    [name, photoPath, durationDays || null, id],
  );
}

export async function deleteMedicationTimes(medicationId: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM medication_times WHERE medication_id = ?', [medicationId]);
}

export async function deleteMedication(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM medication_times WHERE medication_id = ?', [id]);
  await database.runAsync('DELETE FROM medications WHERE id = ?', [id]);
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const database = await getDb();
  return database.getAllAsync<Appointment>(
    `SELECT id, title, doctor_name as doctorName, scheduled_at as scheduledAt, notification_id as notificationId
     FROM appointments
     WHERE scheduled_at >= ?
     ORDER BY scheduled_at ASC`,
    [Date.now()],
  );
}

export async function addAppointment(
  title: string,
  doctorName: string,
  scheduledAt: Date,
  notificationId: string,
): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO appointments (title, doctor_name, scheduled_at, notification_id) VALUES (?, ?, ?, ?)',
    [title, doctorName, scheduledAt.getTime(), notificationId],
  );
  return result.lastInsertRowId;
}

export async function updateAppointmentNotificationId(id: number, notificationId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE appointments SET notification_id = ? WHERE id = ?',
    [notificationId, id],
  );
}

export async function deleteAppointment(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM appointments WHERE id = ?', [id]);
}
