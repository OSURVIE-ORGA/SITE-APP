import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import TtsService from "@/services/tts-service";
import { useAutoTTS } from "@/hooks/useAutoTTS";

type Kind = "samu" | "police" | "fire";

const SERVICES: {
  kind: Kind;
  number: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  labelKey: string;
  subKey: string;
  descKey: string;
}[] = [
  {
    kind: "samu",
    number: "15",
    icon: "medical",
    color: "#2E7D32",
    labelKey: "help_samu",
    subKey: "emergency_samu_sub",
    descKey: "help_desc_samu",
  },
  {
    kind: "police",
    number: "17",
    icon: "shield-checkmark",
    color: "#1565C0",
    labelKey: "help_police",
    subKey: "emergency_police_sub",
    descKey: "help_desc_police",
  },
  {
    kind: "fire",
    number: "18",
    icon: "flame",
    color: "#D84315",
    labelKey: "help_pompiers",
    subKey: "emergency_pompiers_sub",
    descKey: "help_desc_pompiers",
  },
];

/**
 * Écran d'appel des secours en plein écran. Ouvert par le bouton SOS flottant.
 * Trois grands boutons, voix à l'ouverture, appui long = explication.
 */
export default function EmergencyScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  useAutoTTS("emergency_tts_intro");

  const call = useCallback((number: string) => {
    TtsService.instance.stop();
    Linking.openURL(`tel:${number}`);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("emergency_choose")}</Text>
        <AccessibleButton
          description={t("emergency_desc_close")}
          onTap={() => {
            TtsService.instance.stop();
            router.back();
          }}
        >
          <View style={styles.closeButton}>
            <Ionicons name="close" size={28} color={AppColors.white} />
          </View>
        </AccessibleButton>
      </View>

      <View style={styles.list}>
        {SERVICES.map((s) => (
          <AccessibleButton
            key={s.kind}
            description={t(s.descKey)}
            onTap={() => call(s.number)}
          >
            <View style={[styles.card, { backgroundColor: s.color }]}>
              <View style={styles.iconBadge}>
                <Ionicons name={s.icon} size={38} color={s.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{t(s.labelKey)}</Text>
                <Text style={styles.cardSub}>{t(s.subKey)}</Text>
              </View>
              <Text style={styles.cardNumber}>{s.number}</Text>
            </View>
          </AccessibleButton>
        ))}
      </View>

      <Pressable
        style={styles.closeRow}
        onPress={() => {
          TtsService.instance.stop();
          router.back();
        }}
      >
        <Ionicons name="arrow-back" size={22} color={AppColors.white} />
        <Text style={styles.closeRowText}>{t("emergency_close")}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.red,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  title: {
    flex: 1,
    fontSize: FontSizes.title,
    fontWeight: "900",
    color: AppColors.white,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    borderWidth: 3,
    borderColor: AppColors.white,
    minHeight: 110,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    fontSize: FontSizes.xxl,
    fontWeight: "900",
    color: AppColors.white,
  },
  cardSub: {
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
  },
  cardNumber: {
    fontSize: 40,
    fontWeight: "900",
    color: AppColors.white,
  },
  closeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  closeRowText: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: AppColors.white,
  },
});
