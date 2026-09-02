import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';
import wo from './wo.json';
import bm from './bm.json';
import bn from './bn.json';
import ta from './ta.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦' },
  { code: 'wo', label: 'Wolof', flag: '🇸🇳' },
  { code: 'bm', label: 'Bamanankan', flag: '🇲🇱' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
] as const;

i18next.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    wo: { translation: wo },
    bm: { translation: bm },
    bn: { translation: bn },
    ta: { translation: ta },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

// ── Persistance de la langue choisie ────────────────────────────────────────
export const LANGUAGE_STORAGE_KEY = 'ofacilite.lang';

const SUPPORTED_CODES: readonly string[] = SUPPORTED_LANGUAGES.map(
  (l) => l.code,
);

/** Au démarrage : restaure la langue enregistrée (l'app affiche 'fr' le temps
 *  que AsyncStorage réponde, puis bascule si une préférence existe). */
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then((code) => {
    if (code && SUPPORTED_CODES.includes(code) && code !== i18next.language) {
      void i18next.changeLanguage(code);
    }
  })
  .catch(() => {});

/** Tout changement de langue est enregistré (survit à la fermeture de l'app). */
i18next.on('languageChanged', (code) => {
  void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code).catch(() => {});
});

export default i18next;
