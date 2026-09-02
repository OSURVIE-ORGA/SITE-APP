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
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:3000`;
  }
  return 'https://92-222-70-138.sslip.io';
}

// Shared secret expected by the API on every route except /health. Embedded in
// the JS bundle (EXPO_PUBLIC_*), so it deters casual abuse of the paid Mistral
// endpoints, not a determined attacker — see the review notes.
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

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

  /** fetch + X-API-Key header + timeout. Never sets Content-Type (FormData safe). */
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
        headers: { ...(init.headers ?? {}), 'X-API-Key': API_KEY },
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.warn(
            `[api] 401 on ${path} — EXPO_PUBLIC_API_KEY missing or wrong`,
          );
        } else {
          console.warn(`[api] ${response.status} on ${path}`);
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
        headers: { 'X-API-Key': API_KEY },
        signal: controller.signal,
      });
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
