import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TtsService from '@/services/tts-service';

export function useAutoTTS(translationKey: string) {
  const { t, i18n } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      TtsService.instance.init(i18n.language);
      const textToSpeak = t(translationKey);

      // We add a slight delay to avoid blocking rendering and overlapping with previous screens
      const timer = setTimeout(async () => {
        if (isFocused) {
          await TtsService.instance.speak(textToSpeak);
        }
      }, 800);

      return () => {
        isFocused = false;
        clearTimeout(timer);
        TtsService.instance.stop();
      };
    }, [t, translationKey])
  );
}
