import * as Speech from 'expo-speech';

/**
 * Service TTS singleton — équivalent du TtsService Flutter.
 * Utilise expo-speech pour la synthèse vocale.
 */
class TtsService {
  private static _instance: TtsService;
  private _language = 'fr-FR';

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
    return new Promise((resolve) => {
      Speech.speak(text, {
        language: this._language,
        rate: 0.9,
        onDone: resolve,
        onError: () => resolve(),
      });
    });
  }

  /** Arrête le TTS en cours */
  async stop(): Promise<void> {
    await Speech.stop();
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
