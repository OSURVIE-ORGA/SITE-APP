import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getDefaultApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://localhost:3000';
}

const API_CONFIG = {
  base_url: getDefaultApiUrl(),
};

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


const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = function (e) {
      reject(new TypeError(`Failed to convert URI to Blob: ${JSON.stringify(e)}`));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

/**
 * Service API singleton — équivalent du ApiService Flutter.
 * Communique avec l'API NestJS / Mistral pour les questions, résumés et scan de contacts.
 */
class ApiService {
  private static _instance: ApiService;
  private _baseUrl: string = API_CONFIG.base_url;

  static get instance(): ApiService {
    if (!ApiService._instance) {
      ApiService._instance = new ApiService();
    }
    return ApiService._instance;
  }

  setBaseUrl(url: string): void {
    this._baseUrl = url;
  }

  getBaseUrl(): string {
    return this._baseUrl;
  }

  /** Envoyer une photo de contact à l'API Multer pour la sauvegarder et la scanner via IA */
  async scanContactPhoto(imageUri: string): Promise<ScanContactResponse | null> {
    const baseUrl = this._baseUrl || getDefaultApiUrl();
    try {
      const filename = imageUri.split('/').pop() || 'contact.jpg';
      const cleanFilename = filename.split('?')[0];
      const match = /\.(\w+)$/.exec(cleanFilename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      let fileBlob: Blob;
      try {
        const res = await fetch(imageUri);
        fileBlob = await res.blob();
      } catch {
        fileBlob = await uriToBlob(imageUri);
      }

      const formData = new FormData();
      formData.append('file', fileBlob, cleanFilename);

      // NE PAS spécifier 'Content-Type': 'multipart/form-data' dans headers
      // fetch génère automatiquement le boundary correct en React Native
      const response = await fetch(`${baseUrl}/mistral/scan-photo`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorText = await response.text();
        console.error('Server error scanContactPhoto:', response.status, errorText);
      }
      return null;
    } catch (error) {
      console.error('Error scanning contact photo:', error);
      return null;
    }
  }

  /** Envoyer une photo de médicament à l'API Multer pour la sauvegarder et la scanner via IA */
  async scanMedicationPhoto(imageUri: string): Promise<ScanMedicationResponse | null> {
    const baseUrl = this._baseUrl || getDefaultApiUrl();
    try {
      const filename = imageUri.split('/').pop() || 'medication.jpg';
      const cleanFilename = filename.split('?')[0];

      let fileBlob: Blob;
      try {
        const res = await fetch(imageUri);
        fileBlob = await res.blob();
      } catch {
        fileBlob = await uriToBlob(imageUri);
      }

      const formData = new FormData();
      formData.append('file', fileBlob, cleanFilename);

      const response = await fetch(`${baseUrl}/mistral/scan-medication`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorText = await response.text();
        console.error('Server error scanMedicationPhoto:', response.status, errorText);
      }
      return null;
    } catch (error) {
      console.error('Error scanning medication photo:', error);
      return null;
    }
  }




  /** Poser une question à l'IA */
  async ask(question: string, language: string): Promise<string | null> {
    if (!this._baseUrl) return null;
    try {
      const response = await fetch(`${this._baseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.answer ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Résumer un texte */
  async summarize(text: string, language: string): Promise<string | null> {
    if (!this._baseUrl) return null;
    try {
      const response = await fetch(`${this._baseUrl}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.summary ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export default ApiService;

