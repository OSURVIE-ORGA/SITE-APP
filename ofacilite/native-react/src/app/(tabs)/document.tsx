import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, BorderColor, FontSizes, MutedColor, Spacing } from "@/constants/theme";
import ApiService from "@/services/api-service";
import TtsService from "@/services/tts-service";

export default function DocumentScreen() {
  const { t, i18n } = useTranslation();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    TtsService.instance.init(i18n.language);
    const timer = setTimeout(() => {
      TtsService.instance.speak(t("document_tts_intro"));
    }, 800);
    return () => {
      clearTimeout(timer);
      TtsService.instance.stop();
    };
  }, []);

  // Dots animation for loading
  useEffect(() => {
    if (!analyzing && !summarizing) return;
    const interval = setInterval(() => {
      setDotCount((c) => (c === 3 ? 1 : c + 1));
    }, 600);
    return () => clearInterval(interval);
  }, [analyzing, summarizing]);

  const dots = ".".repeat(dotCount);

  const pickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (result.canceled || !result.assets?.[0]) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setExtractedText(null);
    setSummary(null);
    setSummarizing(false);
    setSummaryFailed(false);
    setAnalyzing(true);

    // En mode Expo managé, pas d'OCR on-device. On envoie le texte
    // directement à l'API pour résumé. Pour simplifier, on simule l'OCR
    // en envoyant une indication à l'API.
    // En production, vous ajouteriez l'OCR côté serveur.
    setTimeout(async () => {
      setAnalyzing(false);
      setSummarizing(true);
      const lang = i18n.language;
      const text = `[Photo de document envoyée pour analyse]`;
      setExtractedText(text);

      const summaryResult = await ApiService.instance.summarize(text, lang);
      await TtsService.instance.stop();

      if (summaryResult) {
        setSummary(summaryResult);
        setSummarizing(false);
        setSummaryFailed(false);
        await TtsService.instance.speak(summaryResult);
      } else {
        setSummary(null);
        setSummarizing(false);
        setSummaryFailed(true);
        await TtsService.instance.speak(text);
      }
    }, 1500);
  };

  const reset = () => {
    TtsService.instance.stop();
    setImageUri(null);
    setExtractedText(null);
    setSummary(null);
    setAnalyzing(false);
    setSummarizing(false);
    setSummaryFailed(false);
  };

  if (!imageUri) {
    return (
      <View style={styles.shell}>
        <View style={styles.backgroundAccent} />
        <View style={styles.pickerContainer}>
          <AccessibleButton
            description={t("document_desc_take_photo")}
            onTap={() => pickImage(true)}
          >
            <View style={[styles.primaryButton]}>
              <Ionicons name="camera" size={36} color={AppColors.white} />
              <Text style={styles.primaryButtonText}>
                {t("document_take_photo")}
              </Text>
            </View>
          </AccessibleButton>

          <AccessibleButton
            description={t("document_desc_gallery")}
            onTap={() => pickImage(false)}
          >
            <View style={styles.outlinedButton}>
              <Ionicons name="images" size={28} color={AppColors.primary} />
              <Text style={styles.outlinedButtonText}>
                {t("document_gallery")}
              </Text>
            </View>
          </AccessibleButton>
        </View>
      </View>
    );
  }

  const isLoading = analyzing || summarizing;

  return (
    <View style={styles.resultContainer}>
      <View style={styles.backgroundAccent} />
      <Image source={{ uri: imageUri }} style={styles.imagePreview} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>
            {t("document_loading_label")}
            {dots}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {summary ? (
            <>
              <View style={styles.textBox}>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
              <Text style={styles.extractedTextLight}>{extractedText}</Text>
            </>
          ) : (
            <>
              <View style={styles.textBox}>
                <Text style={styles.summaryText}>{extractedText}</Text>
              </View>
              {summaryFailed && (
                <View style={styles.offlineRow}>
                  <Ionicons name="cloud-offline" size={14} color="#BBBBBB" />
                  <Text style={styles.offlineText}>
                    {t("document_summary_offline")}
                  </Text>
                </View>
              )}
            </>
          )}

          <AccessibleButton
            description={t("document_desc_new_photo")}
            onTap={reset}
          >
            <View style={[styles.primaryButton, { marginTop: Spacing.xxl }]}>
              <Ionicons name="refresh" size={24} color={AppColors.dark} />
              <Text style={styles.primaryButtonText}>
                {t("document_new_photo")}
              </Text>
            </View>
          </AccessibleButton>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  backgroundAccent: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(79,140,255,0.10)",
  },
  pickerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.xxl,
    backgroundColor: AppColors.cream,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    backgroundColor: AppColors.dark,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    width: "100%",
    minHeight: 80,
  },
  primaryButtonText: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: AppColors.white,
  },
  outlinedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: BorderColor,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    width: "100%",
    minHeight: 60,
  },
  outlinedButtonText: {
    fontSize: FontSizes.lg,
    color: AppColors.primary,
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  imagePreview: {
    width: "100%",
    height: 260,
    resizeMode: "cover",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xxxl,
    paddingHorizontal: Spacing.xxxl,
  },
  loadingText: {
    fontSize: FontSizes.xxl,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "center",
    lineHeight: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  textBox: {
    padding: Spacing.lg,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: BorderColor,
    shadowColor: "#0A1630",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  summaryText: {
    fontSize: FontSizes.lg,
    lineHeight: 28,
    color: AppColors.text,
  },
  extractedTextLight: {
    fontSize: FontSizes.sm,
    lineHeight: 22,
    color: MutedColor,
    marginTop: Spacing.lg,
  },
  offlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  offlineText: {
    fontSize: FontSizes.xs,
    color: MutedColor,
  },
});
