import * as SQLite from 'expo-sqlite';

export interface Medication {
  id: number;
  name: string;
  photoPath: string | null;
  notificationId: string;
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

export interface ContactPhoto {
  contactId: string;
  photoPath: string;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('ofacilite_db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS contact_photos (
      contact_id TEXT PRIMARY KEY,
      photo_path TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      photo_path TEXT,
      notification_id TEXT NOT NULL DEFAULT ''
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

  return db;
}

// ── Contact Photos ────────────────────────────────────────────────────────────

export async function getPhotoForContact(contactId: string): Promise<string | null> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ photo_path: string }>(
    'SELECT photo_path FROM contact_photos WHERE contact_id = ?',
    [contactId],
  );
  return result?.photo_path ?? null;
}

export async function savePhotoForContact(contactId: string, photoPath: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO contact_photos (contact_id, photo_path) VALUES (?, ?)',
    [contactId, photoPath],
  );
}

// ── Medications ───────────────────────────────────────────────────────────────

export async function getMedicationsWithTimes(): Promise<MedicationWithTimes[]> {
  const database = await getDb();
  const meds = await database.getAllAsync<Medication>(
    'SELECT id, name, photo_path as photoPath, notification_id as notificationId FROM medications',
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
): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO medications (name, photo_path, notification_id) VALUES (?, ?, ?)',
    [name, photoPath, notificationId],
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
