import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Service TTS singleton — équivalent du TtsService Flutter.
 * Utilise expo-speech pour la synthèse vocale.
 */
class TtsService {
  private static _instance: TtsService;
  private _language = 'fr-FR';
  private _isPaused = false;
  private _lastSpokenText: string | null = null;

  static get instance(): TtsService {
    if (!TtsService._instance) {
      TtsService._instance = new TtsService();
    }
    return TtsService._instance;
  }

  /** Initialise la langue TTS */
  init(languageCode: string): void {
    switch (languageCode) {
      case 'ar':
        this._language = 'ar-SA';
        break;
      case 'en':
        this._language = 'en-US';
        break;
      case 'ta':
        this._language = 'ta-IN';
        break;
      default:
        this._language = 'fr-FR';
    }
  }

  /** Parle un texte, en arrêtant d'abord tout TTS en cours */
  async speak(text: string): Promise<void> {
    await this.stop();
    this._lastSpokenText = text;
    this._isPaused = false;
    return new Promise((resolve) => {
      Speech.speak(text, {
        language: this._language,
        rate: 0.9,
        onDone: resolve,
        onStopped: resolve,
        onError: () => resolve(),
      });
    });
  }

  /** Arrête le TTS en cours */
  async stop(): Promise<void> {
    await Speech.stop();
    this._isPaused = false;
  }

  /**
   * Vrai si la plateforme sait vraiment mettre en pause / reprendre à
   * l'endroit exact (iOS et Web). Sur Android, expo-speech ne supporte
   * pas pause()/resume() : on simule en relisant le texte depuis le début.
   */
  get canTruePause(): boolean {
    return Platform.OS !== 'android';
  }

  /** Met la synthèse vocale en pause (ou l'arrête si la plateforme ne sait pas reprendre) */
  async pause(): Promise<void> {
    if (this.canTruePause) {
      await Speech.pause();
    } else {
      await Speech.stop();
    }
    this._isPaused = true;
  }

  /** Reprend la lecture (ou la relance depuis le début sur Android) */
  async resume(): Promise<void> {
    if (this.canTruePause) {
      await Speech.resume();
      this._isPaused = false;
      return;
    }
    if (this._lastSpokenText) {
      await this.speak(this._lastSpokenText);
    }
  }

  /** Bascule pause / reprise en une seule commande, pratique pour un bouton unique */
  async togglePause(): Promise<void> {
    if (this._isPaused) {
      await this.resume();
    } else {
      await this.pause();
    }
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  /** Vérifie si le TTS est en cours */
  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }

  get language(): string {
    return this._language;
  }
}

export default TtsService;
