import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, FontSizes, Spacing } from "@/constants/theme";
import TtsService from "@/services/tts-service";

/**
 * Chargement optionnel de expo-speech-recognition : tant que le module natif
 * n'est pas lié (avant un rebuild), `require` lève une exception. On dégrade
 * alors proprement — le champ texte reste disponible dans l'écran parent.
 */
let SR: typeof import("expo-speech-recognition") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SR = require("expo-speech-recognition");
} catch {
  SR = null;
}

const LANG_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-SA",
  ta: "ta-IN",
  bn: "bn-BD",
  wo: "fr-FR",
  bm: "fr-FR",
};

interface VoiceInputProps {
  lang: string;
  disabled?: boolean;
  onResult: (text: string) => void;
}

/**
 * Gros bouton micro. Un appui = démarre l'écoute ; un nouvel appui = arrête.
 * La transcription finale est envoyée à `onResult`. Appui long = la voix
 * explique. Entrée principale pour les personnes qui ne savent pas écrire.
 */
export default function VoiceInput({ lang, disabled, onResult }: VoiceInputProps) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Refs → l'effet des listeners ne se ré-attache jamais (sinon on perd
  // l'événement final quand un rendu tombe entre un résultat et la fin).
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const transcriptRef = useRef("");
  const submittedRef = useRef(false);
  const retriedRef = useRef(false);

  const startRecognition = useCallback(
    (useLang: boolean) => {
      if (!SR) return;
      transcriptRef.current = "";
      submittedRef.current = false;
      setPartial("");
      setErrorInfo(null);
      SR.ExpoSpeechRecognitionModule.start({
        lang: useLang ? LANG_MAP[lang] ?? "fr-FR" : undefined,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        androidIntentOptions: {
          // Laisser le temps de parler / d'hésiter avant de couper l'écoute.
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 4000,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 5000,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 5000,
        },
      });
    },
    [lang],
  );

  const finish = useCallback(() => {
    setListening(false);
    const text = transcriptRef.current.trim();
    setPartial("");
    if (text && !submittedRef.current) {
      submittedRef.current = true;
      onResultRef.current(text);
    }
  }, []);

  useEffect(() => {
    if (!SR) return;
    const mod = SR.ExpoSpeechRecognitionModule;
    const subs = [
      mod.addListener("start", () => {
        submittedRef.current = false;
        transcriptRef.current = "";
        setListening(true);
      }),
      mod.addListener("result", (e: any) => {
        const transcript = e?.results?.[0]?.transcript ?? "";
        if (transcript) {
          transcriptRef.current = transcript;
          setPartial(transcript);
        }
        if (e?.isFinal) finish();
      }),
      mod.addListener("end", () => finish()),
      mod.addListener("error", (e: any) => {
        const code = e?.error ?? "unknown";
        const message = e?.message ?? "";
        // Visible dans le terminal Metro
        console.warn(`[voice] error code="${code}" message="${message}"`);
        setListening(false);
        setPartial("");

        // Pack de langue absent → on retente une fois avec la langue du système
        if (
          (code === "language-not-supported" || code === "language-unavailable") &&
          !retriedRef.current
        ) {
          retriedRef.current = true;
          setErrorInfo(`${code} → nouvel essai (langue système)`);
          setTimeout(() => startRecognition(false), 300);
          return;
        }

        setErrorInfo(`${code}${message ? " — " + message : ""}`);
        if (code === "not-allowed" || code === "service-not-allowed") {
          TtsService.instance.speak(t("voice_no_permission"));
        } else if (code === "no-speech") {
          TtsService.instance.speak(t("voice_not_understood"));
        } else if (code && code !== "aborted") {
          TtsService.instance.speak(t("voice_not_understood"));
        }
      }),
    ];
    return () => subs.forEach((s) => s?.remove?.());
  }, [finish, startRecognition, t]);

  const toggle = useCallback(async () => {
    if (disabled || !SR) return;
    const mod = SR.ExpoSpeechRecognitionModule;

    if (listening) {
      mod.stop(); // → résultat final puis "end"
      return;
    }
    try {
      const perm = await mod.requestPermissionsAsync();
      if (!perm.granted) {
        TtsService.instance.speak(t("voice_no_permission"));
        setErrorInfo("permission refusée");
        return;
      }
      await TtsService.instance.stop();
      retriedRef.current = false;
      startRecognition(true);
    } catch (err: any) {
      console.warn("[voice] start threw:", err);
      setErrorInfo(String(err?.message ?? err));
      TtsService.instance.speak(t("voice_no_permission"));
    }
  }, [disabled, listening, startRecognition, t]);

  // Module natif absent (avant rebuild) : on n'affiche pas le micro.
  if (!SR) return null;

  return (
    <View style={styles.wrap}>
      <AccessibleButton description={t("voice_desc_mic")} onTap={toggle}>
        <View style={[styles.mic, listening && styles.micActive]}>
          <Ionicons
            name={listening ? "stop" : "mic"}
            size={54}
            color={AppColors.white}
          />
        </View>
      </AccessibleButton>
      <Text style={styles.hint}>
        {listening ? t("voice_listening") : t("voice_tap_to_speak")}
      </Text>
      {partial.length > 0 && <Text style={styles.partial}>{partial}</Text>}
      {errorInfo && <Text style={styles.error}>⚠️ {errorInfo}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  mic: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: AppColors.dark,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  micActive: {
    backgroundColor: AppColors.red,
  },
  hint: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: AppColors.text,
  },
  partial: {
    fontSize: FontSizes.md,
    color: AppColors.dark,
    textAlign: "center",
    fontStyle: "italic",
  },
  error: {
    fontSize: FontSizes.sm,
    color: AppColors.red,
    textAlign: "center",
  },
});
