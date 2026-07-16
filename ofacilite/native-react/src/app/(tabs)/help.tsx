import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, BorderColor, FontSizes, MutedColor, Spacing } from "@/constants/theme";
import ApiService from "@/services/api-service";
import TtsService from "@/services/tts-service";

function getEmergencyIcon(type: "samu" | "police" | "fire") {
  switch (type) {
    case "samu":
      return "medical-outline";
    case "police":
      return "shield-checkmark-outline";
    case "fire":
      return "flame-outline";
  }
}

export default function HelpScreen() {
  const { t, i18n } = useTranslation();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [answerFailed, setAnswerFailed] = useState(false);

  useEffect(() => {
    TtsService.instance.init(i18n.language);
    const timer = setTimeout(() => {
      TtsService.instance.speak(t("help_tts_intro"));
    }, 800);
    return () => {
      clearTimeout(timer);
      TtsService.instance.stop();
    };
  }, []);

  const callNumber = useCallback((number: string) => {
    Linking.openURL(`tel:${number}`);
  }, []);

  const askQuestion = useCallback(async () => {
    if (!question.trim() || isAsking) return;
    setIsAsking(true);
    setAnswer(null);
    setAnswerFailed(false);

    const lang = i18n.language;
    const result = await ApiService.instance.ask(question.trim(), lang);

    if (result) {
      setAnswer(result);
      setIsAsking(false);
      await TtsService.instance.stop();
      await TtsService.instance.speak(result);
    } else {
      setIsAsking(false);
      setAnswerFailed(true);
    }
  }, [question, isAsking, i18n.language]);

  const reset = useCallback(() => {
    TtsService.instance.stop();
    setQuestion("");
    setAnswer(null);
    setIsAsking(false);
    setAnswerFailed(false);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.voiceSection}
        contentContainerStyle={styles.voiceSectionContent}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.questionInput}
            placeholder={t("help_question_placeholder")}
            placeholderTextColor="#8D99AE"
            value={question}
            onChangeText={setQuestion}
            multiline
            textAlignVertical="top"
          />
        </View>

        {question.trim().length > 0 && (
          <>
            {!isAsking && !answer && !answerFailed && (
              <Pressable style={styles.askButton} onPress={askQuestion}>
                <Ionicons name="sparkles" size={22} color={AppColors.white} />
                <Text style={styles.askButtonText}>{t("help_ask_button")}</Text>
              </Pressable>
            )}

            {isAsking && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={AppColors.primary} />
                <Text style={styles.loadingText}>{t("help_asking")}</Text>
              </View>
            )}

            {answer && (
              <>
                <View style={styles.answerBox}>
                  <Text style={styles.answerText}>{answer}</Text>
                </View>
                <View style={styles.disclaimerBox}>
                  <Text style={styles.disclaimerText}>
                    {t("help_disclaimer")}
                  </Text>
                </View>
              </>
            )}

            {answerFailed && (
              <View style={styles.errorRow}>
                <Ionicons
                  name="cloud-offline"
                  size={16}
                  color={MutedColor}
                />
                <Text style={styles.errorText}>{t("help_answer_error")}</Text>
              </View>
            )}

            <Pressable
              style={styles.retryButton}
              onPress={reset}
              disabled={isAsking}
            >
              <Ionicons name="refresh" size={20} color={AppColors.primary} />
              <Text style={styles.retryText}>{t("help_retry")}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <View style={styles.divider} />

      <View style={styles.emergencySection}>
        <Text style={styles.emergencyTitle}>{t("help_emergencies")}</Text>

        <AccessibleButton
          description={t("help_desc_samu")}
          onTap={() => callNumber("15")}
        >
          <View style={[styles.emergencyButton, styles.samuButton]}>
            <View style={[styles.emergencyIconBadge, styles.samuBadge]}>
              <Ionicons
                name={getEmergencyIcon("samu")}
                size={22}
                color={AppColors.white}
              />
            </View>
            <View style={styles.emergencyTextBlock}>
              <Text style={styles.emergencyLabel}>{t("help_samu")}</Text>
              <Text style={styles.emergencyHint}>{t("help_desc_samu")}</Text>
            </View>
            <Text style={styles.emergencyNumber}>15</Text>
          </View>
        </AccessibleButton>

        <AccessibleButton
          description={t("help_desc_police")}
          onTap={() => callNumber("17")}
        >
          <View style={[styles.emergencyButton, styles.policeButton]}>
            <View style={[styles.emergencyIconBadge, styles.policeBadge]}>
              <Ionicons
                name={getEmergencyIcon("police")}
                size={22}
                color={AppColors.white}
              />
            </View>
            <View style={styles.emergencyTextBlock}>
              <Text style={styles.emergencyLabel}>{t("help_police")}</Text>
              <Text style={styles.emergencyHint}>{t("help_desc_police")}</Text>
            </View>
            <Text style={styles.emergencyNumber}>17</Text>
          </View>
        </AccessibleButton>

        <AccessibleButton
          description={t("help_desc_pompiers")}
          onTap={() => callNumber("18")}
        >
          <View style={[styles.emergencyButton, styles.fireButton]}>
            <View style={[styles.emergencyIconBadge, styles.fireBadge]}>
              <Ionicons
                name={getEmergencyIcon("fire")}
                size={22}
                color={AppColors.white}
              />
            </View>
            <View style={styles.emergencyTextBlock}>
              <Text style={styles.emergencyLabel}>{t("help_pompiers")}</Text>
              <Text style={styles.emergencyHint}>
                {t("help_desc_pompiers")}
              </Text>
            </View>
            <Text style={styles.emergencyNumber}>18</Text>
          </View>
        </AccessibleButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  voiceSection: {
    flex: 3,
  },
  voiceSectionContent: {
    padding: Spacing.xxl,
    gap: Spacing.md,
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
  },
  questionInput: {
    borderWidth: 1.5,
    borderColor: BorderColor,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    fontSize: FontSizes.xl,
    color: AppColors.text,
    backgroundColor: AppColors.white,
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#0A1630",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  askButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.dark,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    width: "100%",
    minHeight: 56,
  },
  askButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: AppColors.white,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: MutedColor,
  },
  answerBox: {
    width: "100%",
    padding: Spacing.lg,
    backgroundColor: "#EAF7EE",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#A9DDB5",
  },
  answerText: {
    fontSize: FontSizes.lg,
    color: "#14532D",
    lineHeight: 26,
    textAlign: "center",
  },
  disclaimerBox: {
    width: "100%",
    padding: Spacing.md,
    backgroundColor: "#FFF8E8",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#F2C46D",
  },
  disclaimerText: {
    fontSize: FontSizes.sm,
    color: "#7C5A00",
    lineHeight: 20,
    textAlign: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: MutedColor,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  retryText: {
    fontSize: FontSizes.lg,
    color: AppColors.primary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: BorderColor,
  },
  emergencySection: {
    flex: 2,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  emergencyTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: "800",
    color: AppColors.dark,
    marginBottom: Spacing.xs,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: BorderColor,
    backgroundColor: AppColors.white,
    width: "100%",
    marginBottom: Spacing.sm,
    shadowColor: "#0A1630",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  emergencyIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyTextBlock: {
    flex: 1,
    gap: 2,
  },
  emergencyLabel: {
    fontSize: FontSizes.lg,
    fontWeight: "800",
    color: AppColors.text,
  },
  emergencyHint: {
    fontSize: FontSizes.xs,
    color: MutedColor,
    lineHeight: 16,
  },
  emergencyNumber: {
    fontSize: FontSizes.title,
    fontWeight: "800",
    color: AppColors.dark,
  },
  samuButton: {
    backgroundColor: "#E6F7E9",
  },
  samuBadge: {
    backgroundColor: "#4CAF50",
  },
  policeButton: {
    backgroundColor: "#dceaf7",
  },
  policeBadge: {
    backgroundColor: "#325476",
  },
  fireButton: {
    backgroundColor: "#FDE8E8",
  },
  fireBadge: {
    backgroundColor: "#D32F2F",
  },
});
