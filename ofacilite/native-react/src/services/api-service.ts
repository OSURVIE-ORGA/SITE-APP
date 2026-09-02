import Constants from 'expo-constants';
import { File as FsFile, UploadType } from 'expo-file-system';

/**
 * Base URL resolution:
 *  1. EXPO_PUBLIC_API_URL (set it in .env / eas.json for real builds)
 *  2. the Expo dev-server host, assuming the API runs on :3000 of the same
 *     machine (local development on a device / emulator)
 *  3. the deployed API (fallback for a build with no env var)
 */
function resolveApiUrl(): string {
  let base: string;
  if (process.env.EXPO_PUBLIC_API_URL) {
    base = process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  } else {
    const hostUri = Constants.expoConfig?.hostUri;
    base = hostUri
      ? `http://${hostUri.split(':')[0]}:3000`
      : 'https://92-222-70-138.sslip.io';
  }
  // Toutes les routes NestJS sont sous /api.
  return `${base}/api`;
}

const DEFAULT_TIMEOUT_MS = 25_000;

export interface AskTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ScanContactResponse {
  success: boolean;
  name: string | null;
  phone: string | null;
  photoUrl: string | null;
  filename?: string;
}

export interface ScanMedicationResponse {
  success: boolean;
  name: string | null;
  frequency: number | null;
  durationDays: number | null;
  suggestedHours: number[] | null;
  photoUrl: string | null;
  filename?: string;
}

/** Instantané poussé vers l'API pour que l'aidant/admin puisse le consulter. */
export interface SyncMedication {
  name: string;
  startDate?: string | null; // ISO
  durationDays?: number | null;
  times: { hour: number; minute: number }[];
}

export interface SyncAppointment {
  title: string;
  doctorName?: string;
  scheduledAt: string; // ISO
}

export interface SyncContact {
  name: string;
  phone: string;
}

/** Formes renvoyées par l'API (GET /me/*) lors du pull à la connexion. */
export interface ServerMedication {
  id: string;
  name: string;
  startDate: string | null; // YYYY-MM-DD
  durationDays: number | null;
  endDate: string | null;
  times: { hour: number; minute: number }[];
}

export interface ServerAppointment {
  id: string;
  title: string;
  doctorName: string;
  scheduledAt: string; // ISO
}

export interface ServerContact {
  id: string;
  name: string;
  phone: string;
}

export interface ChatMessage {
  id: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
}

// React Native's fetch multipart wants a { uri, name, type } part, not a Blob.
type RNFilePart = { uri: string; name: string; type: string };

function toFilePart(imageUri: string): RNFilePart {
  const name = (imageUri.split('/').pop() ?? 'photo.jpg').split('?')[0];
  const ext = /\.(\w+)$/.exec(name)?.[1]?.toLowerCase() ?? 'jpg';
  const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return { uri: imageUri, name, type };
}

/**
 * Service API singleton. Parle à l'API NestJS (Mistral) : question libre,
 * résumé, scan de photo de contact / médicament.
 */
class ApiService {
  private static _instance: ApiService;
  private _baseUrl: string = resolveApiUrl();
  private _authToken: string | null = null;
  private _onUnauthorized: (() => void) | null = null;

  static get instance(): ApiService {
    if (!ApiService._instance) {
      ApiService._instance = new ApiService();
    }
    return ApiService._instance;
  }

  setBaseUrl(url: string): void {
    this._baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this._baseUrl;
  }

  /** Jeton de session (JWT) — placé sur chaque requête en `Authorization`. */
  setAuthToken(token: string | null): void {
    this._authToken = token;
  }

  /** Appelé sur un 401 (jeton expiré/révoqué) : l'AuthProvider déconnecte. */
  setOnUnauthorized(cb: (() => void) | null): void {
    this._onUnauthorized = cb;
  }

  private authHeader(): Record<string, string> {
    return this._authToken ? { Authorization: `Bearer ${this._authToken}` } : {};
  }

  /** Connexion par numéro -> renvoie le JWT (ou null). */
  async login(loginCode: string): Promise<string | null> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginCode }),
    });
    if (!response) return null;
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  }

  /** fetch + Authorization + timeout. Never sets Content-Type (FormData safe). */
  private async request(
    path: string,
    init: RequestInit,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${this._baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { ...(init.headers ?? {}), ...this.authHeader() },
      });
      if (!response.ok) {
        console.warn(`[api] ${response.status} on ${path}`);
        if (response.status === 401 && path !== '/auth/login') {
          this._onUnauthorized?.();
        }
        return null;
      }
      return response;
    } catch (err) {
      console.warn(`[api] request failed on ${path}:`, err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Envoi multipart d'un fichier local. On passe par expo-file-system (upload
   * natif) et NON par fetch/FormData : le fetch global d'Expo SDK 57 ne sait
   * pas gérer une part `{ uri, name, type }` de React Native
   * ("Unsupported FormDataPart implementation").
   */
  private async uploadFile(
    path: string,
    fileUri: string,
    mimeType: string,
    timeoutMs = 60_000,
  ): Promise<
    | { status: number; body: string }
    | { failed: 'timeout' | 'network'; detail?: string }
  > {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await new FsFile(fileUri).upload(`${this._baseUrl}${path}`, {
        httpMethod: 'POST',
        uploadType: UploadType.MULTIPART,
        fieldName: 'file',
        mimeType,
        headers: this.authHeader(),
        signal: controller.signal,
      });
      if (res.status === 401) this._onUnauthorized?.();
      return { status: res.status, body: res.body };
    } catch (err) {
      const e = err as { name?: string; message?: string };
      const aborted = e?.name === 'AbortError';
      console.warn(
        `[api] upload ${aborted ? 'timeout' : 'failed'} on ${path}:`,
        e?.message ?? err,
      );
      return {
        failed: aborted ? 'timeout' : 'network',
        detail: aborted ? undefined : e?.message ?? String(err),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async scanImage<T>(path: string, imageUri: string): Promise<T | null> {
    const res = await this.uploadFile(path, imageUri, toFilePart(imageUri).type);
    if ('failed' in res) return null;
    if (res.status < 200 || res.status >= 300) {
      console.warn(`[api] ${res.status} on ${path}: ${res.body.slice(0, 200)}`);
      return null;
    }
    try {
      return JSON.parse(res.body) as T;
    } catch {
      return null;
    }
  }

  /** Photo de contact -> { name, phone } extraits par l'IA. */
  scanContactPhoto(imageUri: string): Promise<ScanContactResponse | null> {
    return this.scanImage<ScanContactResponse>('/mistral/scan-photo', imageUri);
  }

  /** Phrase dictée -> { name, phone } extraits par l'IA (ajout de contact à la voix). */
  async parseContactFromSpeech(
    text: string,
  ): Promise<ScanContactResponse | null> {
    const response = await this.request('/mistral/parse-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response) return null;
    return (await response.json()) as ScanContactResponse;
  }

  /** Photo de médicament / ordonnance -> posologie extraite par l'IA. */
  scanMedicationPhoto(
    imageUri: string,
  ): Promise<ScanMedicationResponse | null> {
    return this.scanImage<ScanMedicationResponse>(
      '/mistral/scan-medication',
      imageUri,
    );
  }

  /**
   * Poser une question libre à l'IA. `language` = code i18n courant.
   * `history` = tours précédents de la même conversation (questions de suivi) ;
   * l'API ne garde que les derniers.
   */
  async ask(
    question: string,
    language?: string,
    history?: AskTurn[],
  ): Promise<string | null> {
    const body: Record<string, unknown> = { question, language };
    if (history && history.length > 0) body.history = history;

    const response = await this.request('/mistral/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response) return null;
    const data = (await response.json()) as { answer?: string };
    return data.answer ?? null;
  }

  /**
   * Pousse l'instantané complet des traitements de la personne connectée
   * (remplace côté serveur). Silencieux : ne bloque jamais l'UI, échoue en
   * douceur hors-ligne.
   */
  async syncMedications(medications: SyncMedication[]): Promise<boolean> {
    const res = await this.request('/me/medications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medications }),
    });
    return res !== null;
  }

  /** Pousse l'instantané complet des rendez-vous de la personne connectée. */
  async syncAppointments(appointments: SyncAppointment[]): Promise<boolean> {
    const res = await this.request('/me/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointments }),
    });
    return res !== null;
  }

  /** Pousse l'instantané complet du carnet de contacts. */
  async syncContacts(contacts: SyncContact[]): Promise<boolean> {
    const res = await this.request('/me/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts }),
    });
    return res !== null;
  }

  /** Pull à la connexion : `null` = échec réseau (ne rien écraser en local). */
  async getMedications(): Promise<ServerMedication[] | null> {
    const res = await this.request('/me/medications', { method: 'GET' });
    if (!res) return null;
    return (await res.json()) as ServerMedication[];
  }

  async getAppointments(): Promise<ServerAppointment[] | null> {
    const res = await this.request('/me/appointments', { method: 'GET' });
    if (!res) return null;
    return (await res.json()) as ServerAppointment[];
  }

  async getContacts(): Promise<ServerContact[] | null> {
    const res = await this.request('/me/contacts', { method: 'GET' });
    if (!res) return null;
    return (await res.json()) as ServerContact[];
  }

  // ── Messagerie avec l'administrateur ──────────────────────────────────────

  /** Fil complet (marque au passage les messages de l'admin comme lus). */
  async getMessages(): Promise<ChatMessage[] | null> {
    const res = await this.request('/me/messages', { method: 'GET' });
    if (!res) return null;
    return (await res.json()) as ChatMessage[];
  }

  async sendMessage(body: string): Promise<ChatMessage | null> {
    const res = await this.request('/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (!res) return null;
    return (await res.json()) as ChatMessage;
  }

  /** Nombre de messages de l'admin non lus (pour la pastille de l'onglet). */
  async getMessagesUnreadCount(): Promise<number> {
    const res = await this.request('/me/messages/unread-count', {
      method: 'GET',
    });
    if (!res) return 0;
    const data = (await res.json()) as { count?: number };
    return data.count ?? 0;
  }

  /**
   * Réponse au rappel « Avez-vous pris votre médicament ? ». `missed` lève une
   * alerte côté admin.
   */
  async reportMedication(
    medicationName: string,
    status: 'taken' | 'missed',
  ): Promise<boolean> {
    const res = await this.request('/me/medication-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicationName, status }),
    });
    return res !== null;
  }

  /**
   * Résumé de texte. L'API n'a pas d'endpoint dédié : on passe par /mistral/ask
   * avec une consigne de résumé.
   */
  async summarize(text: string, language?: string): Promise<string | null> {
    if (!text.trim()) return null;
    return this.ask(
      `Résume le texte suivant en quelques phrases simples :\n\n${text}`,
      language,
    );
  }

  /**
   * Lecture d'un document (photo OU fichier PDF) : l'IA le lit et l'explique
   * en phrases simples. Renvoie soit `{ answer }`, soit `{ error }` détaillé
   * (l'OCR échoue pour bien d'autres raisons que "pas d'internet").
   */
  async readDocument(
    fileUri: string,
    mimeType: string,
    language?: string,
  ): Promise<
    | { answer: string }
    | { error: 'timeout' | 'offline' | 'http'; status?: number; detail?: string }
  > {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    const res = await this.uploadFile(
      `/mistral/read-document${qs}`,
      fileUri,
      mimeType,
    );

    if ('failed' in res) {
      return res.failed === 'timeout'
        ? { error: 'timeout' }
        : { error: 'offline', detail: res.detail };
    }
    if (res.status < 200 || res.status >= 300) {
      console.warn(
        `[api] ${res.status} on read-document: ${res.body.slice(0, 300)}`,
      );
      return { error: 'http', status: res.status, detail: res.body.slice(0, 120) };
    }
    try {
      const data = JSON.parse(res.body) as { answer?: string };
      return data.answer
        ? { answer: data.answer }
        : { error: 'http', status: 200, detail: 'réponse vide' };
    } catch {
      return { error: 'http', status: res.status, detail: 'JSON invalide' };
    }
  }
}

export default ApiService;
