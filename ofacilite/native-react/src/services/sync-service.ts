import i18n from "@/i18n";
import ApiService from "./api-service";
import NotificationService from "./notification-service";
import {
  getContacts,
  getMedicationsWithTimes,
  getUpcomingAppointments,
  replaceAllAppointments,
  replaceAllContacts,
  replaceAllMedications,
  wipeUserData,
} from "./database";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

// ── Push : instantané local → serveur ────────────────────────────────────────

export async function pushContacts(): Promise<void> {
  const contacts = await getContacts();
  await ApiService.instance
    .syncContacts(contacts.map((c) => ({ name: c.name, phone: c.phone })))
    .catch(() => {});
}

export async function pushMedications(): Promise<void> {
  const meds = await getMedicationsWithTimes();
  await ApiService.instance
    .syncMedications(
      meds.map((m) => ({
        name: m.medication.name,
        startDate: m.medication.startDate
          ? new Date(m.medication.startDate).toISOString()
          : null,
        durationDays:
          m.medication.durationDays && m.medication.durationDays > 0
            ? m.medication.durationDays
            : null,
        times: m.times.map((t) => ({ hour: t.hour, minute: t.minute })),
      })),
    )
    .catch(() => {});
}

export async function pushAppointments(): Promise<void> {
  const appts = await getUpcomingAppointments();
  await ApiService.instance
    .syncAppointments(
      appts.map((a) => ({
        title: a.title,
        doctorName: a.doctorName,
        scheduledAt: new Date(a.scheduledAt).toISOString(),
      })),
    )
    .catch(() => {});
}

/** Pousse tout l'état local (utilisé avant la déconnexion). */
export async function pushAllLocal(): Promise<void> {
  await Promise.allSettled([
    pushContacts(),
    pushMedications(),
    pushAppointments(),
  ]);
}

// ── Pull : serveur → local (le compte fait foi) ─────────────────────────────

/**
 * Récupère les données du compte et remplace la copie locale. En cas d'échec
 * réseau, ne touche à rien. Si le serveur est vide mais que le local contient
 * des données (montée de version), on pousse le local au lieu de l'effacer.
 */
export async function pullFromServer(): Promise<void> {
  const [meds, appts, contacts] = await Promise.all([
    ApiService.instance.getMedications(),
    ApiService.instance.getAppointments(),
    ApiService.instance.getContacts(),
  ]);
  if (meds === null || appts === null || contacts === null) return;

  const [localMeds, localAppts, localContacts] = await Promise.all([
    getMedicationsWithTimes(),
    getUpcomingAppointments(),
    getContacts(),
  ]);

  if (meds.length === 0 && localMeds.length > 0) {
    await pushMedications();
  } else {
    await replaceAllMedications(
      meds.map((m) => ({
        name: m.name,
        startDate: m.startDate
          ? new Date(`${m.startDate}T00:00:00`).getTime()
          : null,
        durationDays: m.durationDays,
        times: m.times,
      })),
    );
  }

  if (appts.length === 0 && localAppts.length > 0) {
    await pushAppointments();
  } else {
    await replaceAllAppointments(
      appts.map((a) => ({
        title: a.title,
        doctorName: a.doctorName,
        scheduledAt: new Date(a.scheduledAt).getTime(),
      })),
    );
  }

  if (contacts.length === 0 && localContacts.length > 0) {
    await pushContacts();
  } else {
    // On conserve la photo locale d'un contact si le numéro correspond.
    const photoByPhone = new Map(
      localContacts.map((c) => [onlyDigits(c.phone), c.photoPath]),
    );
    await replaceAllContacts(
      contacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        photoPath: photoByPhone.get(onlyDigits(c.phone)) ?? null,
      })),
    );
  }

  await reconcileHealthNotifications();
}

/** Reprogramme toutes les notifications médicaments / rendez-vous depuis le local. */
export async function reconcileHealthNotifications(): Promise<void> {
  await NotificationService.instance.cancelAll().catch(() => {});

  const meds = await getMedicationsWithTimes();
  for (const m of meds) {
    for (let i = 0; i < m.times.length; i++) {
      await NotificationService.instance
        .scheduleDaily(
          `med_${m.medication.id}_${i}`,
          i18n.t("health_notif_med"),
          m.medication.name,
          m.times[i].hour,
          m.times[i].minute,
        )
        .catch(() => {});
    }
  }

  const appts = await getUpcomingAppointments();
  for (const a of appts) {
    const dt = new Date(a.scheduledAt);
    const body = `${a.doctorName} — ${a.title}`;
    const dayBefore = new Date(dt);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(18, 0, 0, 0);
    await NotificationService.instance
      .scheduleOnce(
        `appt_${a.id}_eve`,
        i18n.t("health_notif_appt_eve"),
        body,
        dayBefore,
      )
      .catch(() => {});
    await NotificationService.instance
      .scheduleOnce(
        `appt_${a.id}_soon`,
        i18n.t("health_notif_appt_soon"),
        body,
        new Date(dt.getTime() - 3600000),
      )
      .catch(() => {});
    await NotificationService.instance
      .scheduleOnce(
        `appt_${a.id}_actual`,
        i18n.t("health_notif_appt_actual"),
        body,
        dt,
      )
      .catch(() => {});
  }
}

/** Déconnexion : sauvegarde vers le compte puis efface le local. */
export async function clearLocalOnSignOut(): Promise<void> {
  await pushAllLocal().catch(() => {});
  await wipeUserData().catch(() => {});
  await NotificationService.instance.cancelAll().catch(() => {});
}
