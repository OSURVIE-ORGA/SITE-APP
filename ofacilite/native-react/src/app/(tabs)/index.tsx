import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BigButton from "@/components/big-button";
import LanguageSheet from "@/components/language-sheet";
import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import TtsService from "@/services/tts-service";
import { useAutoTTS } from "@/hooks/useAutoTTS";

// Visite guidée : mêmes entrées que la grille, dans l'ordre.
const DISCOVERY_KEYS = [
  "home_desc_understand",
  "home_desc_call",
  "home_desc_health",
  "home_desc_findhelp",
] as const;

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [highlightedButton, setHighlightedButton] = useState<number | null>(
    null,
  );
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [muted, setMuted] = useState(TtsService.instance.muted);

  const discoveryCancelled = useRef(false);

  useAutoTTS("home_question");

  const startDiscovery = useCallback(async () => {
    if (isDiscovering) return;
    await TtsService.instance.stop();
    setIsDiscovering(true);
    discoveryCancelled.current = false;
    setHighlightedButton(null);

    for (let i = 0; i < DISCOVERY_KEYS.length; i++) {
      if (discoveryCancelled.current) break;
      setHighlightedButton(i);
      await TtsService.instance.speak(t(DISCOVERY_KEYS[i]));
      if (discoveryCancelled.current) break;
      setHighlightedButton(null);
      await new Promise((r) => setTimeout(r, 2000));
    }

    setIsDiscovering(false);
    setHighlightedButton(null);
  }, [isDiscovering, t]);

  const stopDiscovery = useCallback(async () => {
    discoveryCancelled.current = true;
    await TtsService.instance.stop();
    setIsDiscovering(false);
    setHighlightedButton(null);
  }, []);

  const speakButton = useCallback(
    async (index: number, key: string) => {
      discoveryCancelled.current = true;
      await TtsService.instance.stop();
      setIsDiscovering(false);
      setHighlightedButton(index);
      await TtsService.instance.speak(t(key));
      setHighlightedButton(null);
    },
    [t],
  );

  const navigateTo = useCallback(
    async (screen: string) => {
      discoveryCancelled.current = true;
      await TtsService.instance.stop();
      setIsDiscovering(false);
      setHighlightedButton(null);
      router.push(screen as any);
    },
    [router],
  );

  const handleLanguageChange = useCallback(
    async (code: string) => {
      setShowLanguageSheet(false);
      await i18n.changeLanguage(code);
      TtsService.instance.init(code);
      setTimeout(() => {
        TtsService.instance.speak(t("home_question"));
      }, 400);
    },
    [i18n, t],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundAccentTop} />
      <View style={styles.backgroundAccentBottom} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.brandDot} />
            <Text style={styles.brandName}>{t("home_title")}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                const next = !muted;
                setMuted(next);
                discoveryCancelled.current = true;
                setIsDiscovering(false);
                setHighlightedButton(null);
                TtsService.instance.setMuted(next);
                if (!next) {
                  setTimeout(
                    () => TtsService.instance.speak(t("home_question")),
                    300,
                  );
                }
              }}
              hitSlop={8}
            >
              <Ionicons
                name={muted ? "volume-mute" : "volume-high"}
                size={28}
                color={muted ? AppColors.red : AppColors.dark}
              />
            </Pressable>
            <Pressable
              onPress={isDiscovering ? stopDiscovery : startDiscovery}
              hitSlop={8}
            >
              <Ionicons
                name={isDiscovering ? "stop-circle" : "megaphone"}
                size={28}
                color={isDiscovering ? AppColors.red : AppColors.dark}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                discoveryCancelled.current = true;
                TtsService.instance.stop();
                setIsDiscovering(false);
                setHighlightedButton(null);
                setShowLanguageSheet(true);
              }}
              hitSlop={8}
            >
              <Ionicons name="language" size={28} color={AppColors.dark} />
            </Pressable>
          </View>
        </View>

        {/* Grid — même ordre / mêmes icônes que la barre d'onglets */}
        <View style={styles.grid}>
          <View style={styles.row}>
            <BigButton
              icon="chatbubble-ellipses"
              label={t("home_understand")}
              color={AppColors.dark}
              isHighlighted={highlightedButton === 0}
              onPress={() => navigateTo("/document")}
              onLongPress={() => speakButton(0, "home_desc_understand")}
            />
            <BigButton
              icon="call"
              label={t("home_call")}
              color={AppColors.dark}
              isHighlighted={highlightedButton === 1}
              onPress={() => navigateTo("/contacts")}
              onLongPress={() => speakButton(1, "home_desc_call")}
            />
          </View>
          <View style={styles.row}>
            <BigButton
              icon="heart"
              label={t("home_health")}
              color={AppColors.dark}
              isHighlighted={highlightedButton === 2}
              onPress={() => navigateTo("/health")}
              onLongPress={() => speakButton(2, "home_desc_health")}
            />
            <BigButton
              icon="location"
              label={t("home_findhelp")}
              color={AppColors.dark}
              isHighlighted={highlightedButton === 3}
              onPress={() => navigateTo("/map")}
              onLongPress={() => speakButton(3, "home_desc_findhelp")}
            />
          </View>
        </View>
      </View>

      <LanguageSheet
        visible={showLanguageSheet}
        onSelect={handleLanguageChange}
        onClose={() => setShowLanguageSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  backgroundAccentTop: {
    position: "absolute",
    top: -80,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: "rgba(79,140,255,0.10)",
  },
  backgroundAccentBottom: {
    position: "absolute",
    bottom: -120,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(244,197,66,0.14)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primary,
  },
  brandName: {
    fontSize: FontSizes.title,
    fontWeight: "bold",
    color: AppColors.text,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  grid: {
    flex: 1,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.lg,
  },
});
