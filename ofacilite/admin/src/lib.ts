// Les routes NestJS sont sous /api. VITE_API_URL = hôte de l'API (vide en prod
// -> même origine que le dashboard).
export const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export interface ApiUser {
  id: string;
  loginCode: string;
  role: 'admin' | 'user';
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  age: number | null;
  language: string;
  notes: string | null;
  disabled: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  total: number;
  active: number;
  disabled: number;
  seenLast7d: number;
  seenLast30d: number;
  neverConnected: number;
}

export interface Alert {
  id: string;
  type: 'user_inactive' | 'medication_missed';
  userId: string | null;
  message: string;
  createdAt: string;
  readAt: string | null;
}

export interface LoginDay {
  date: string;
  count: number;
}

export interface CareMedication {
  id: string;
  name: string;
  startDate: string | null;
  durationDays: number | null;
  endDate: string | null;
  times: { hour: number; minute: number }[];
  updatedAt: string;
}

export interface CareAppointment {
  id: string;
  title: string;
  doctorName: string;
  scheduledAt: string;
  updatedAt: string;
}

export interface CareMedicationEvent {
  id: string;
  medicationName: string;
  status: 'taken' | 'missed';
  reportedAt: string;
}

export interface ChatMessage {
  id: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface MessageThread {
  userId: string;
  userName: string;
  lastMessage: string;
  lastAt: string;
  lastFromAdmin: boolean;
  unread: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    ...opts,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (body && (body.message || body.error)) || `Erreur ${res.status}`;
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return body as T;
}

export const LANGS: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  wo: 'Wolof',
  bm: 'Bambara',
  bn: 'বাংলা',
  ta: 'தமிழ்',
};

/** "il y a 3 j", "il y a 2 h", "jamais". */
export function relativeTime(iso: string | null): string {
  if (!iso) return 'jamais';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 31) return `il y a ${d} j`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  return `il y a ${Math.floor(mo / 12)} an(s)`;
}

/** Pastille d'état d'activité par personne. */
export function activityDot(lastSeenAt: string | null): {
  cls: string;
  label: string;
} {
  if (!lastSeenAt) return { cls: 'bg-base-300', label: 'jamais connecté' };
  const days = (Date.now() - new Date(lastSeenAt).getTime()) / 864e5;
  if (days < 7) return { cls: 'bg-success', label: 'actif' };
  if (days < 30) return { cls: 'bg-warning', label: 'ralenti' };
  return { cls: 'bg-error', label: 'inactif' };
}
