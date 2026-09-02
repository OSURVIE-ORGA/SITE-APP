import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import TtsService from "@/services/tts-service";

interface SosButtonProps {
  /** Distance from the bottom of the screen, so it floats above the tab bar. */
  bottomOffset: number;
}

/**
 * Bouton d'urgence rouge, flottant, présent au-dessus de la barre d'onglets
 * sur tous les écrans. Un appui = écran d'appel des secours ; appui long = la
 * voix explique. Placé à gauche pour ne pas gêner les boutons "+" (à droite).
 */
export default function SosButton({ bottomOffset }: SosButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  // Uniquement sur l'accueil.
  if (pathname !== "/") return null;

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <AccessibleButton
        description={t("sos_desc")}
        onTap={() => {
          TtsService.instance.stop();
          router.push("/emergency");
        }}
      >
        <View style={styles.button}>
          <Ionicons name="warning" size={30} color={AppColors.white} />
          <Text style={styles.label}>{t("sos_label")}</Text>
        </View>
      </AccessibleButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: Spacing.lg,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.red,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: AppColors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    fontSize: FontSizes.lg,
    fontWeight: "900",
    color: AppColors.white,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
