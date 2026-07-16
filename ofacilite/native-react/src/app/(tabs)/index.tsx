import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BigButton from "@/components/big-button";
import LanguageSheet from "@/components/language-sheet";
import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import TtsService from "@/services/tts-service";

const DISCOVERY_KEYS = [
  "home_desc_document",
  "home_desc_contacts",
  "home_desc_health",
  "home_desc_map",
] as const;

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [highlightedButton, setHighlightedButton] = useState<number | null>(
    null,
  );
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);

  const discoveryCancelled = useRef(false);

  // Init TTS + welcome speech
  useEffect(() => {
    TtsService.instance.init(i18n.language);
    const timer = setTimeout(() => {
      TtsService.instance.speak(t("home_question"));
    }, 800);
    return () => {
      clearTimeout(timer);
      TtsService.instance.stop();
    };
  }, []);

  // Discovery mode — visite guidée avec highlight glissant
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
            <Pressable onPress={isDiscovering ? stopDiscovery : startDiscovery}>
              <Ionicons
                name={isDiscovering ? "stop-circle" : "megaphone"}
                size={28}
                color={isDiscovering ? AppColors.red : AppColors.dark}
              />
            </Pressable>
            <Pressable onPress={() => navigateTo("/help")}>
              <Ionicons name="hand-left" size={28} color={AppColors.dark} />
            </Pressable>
            <Pressable
              onPress={() => {
                discoveryCancelled.current = true;
                TtsService.instance.stop();
                setIsDiscovering(false);
                setHighlightedButton(null);
                setShowLanguageSheet(true);
              }}
            >
              <Ionicons name="language" size={28} color={AppColors.dark} />
            </Pressable>
          </View>
        </View>

        {/* 4 Big Buttons Grid */}
        <View style={styles.grid}>
          <View style={styles.row}>
            <BigButton
              icon="document-text"
              label={t("home_document")}
              color={AppColors.dark}
              isHighlighted={highlightedButton === 0}
              onPress={() => navigateTo("/document")}
              onLongPress={() => speakButton(0, "home_desc_document")}
            />
            <BigButton
              icon="people"
              label={t("home_contacts")}
              color={AppColors.dark}
              isHighlighted={highlightedButton === 1}
              onPress={() => navigateTo("/contacts")}
              onLongPress={() => speakButton(1, "home_desc_contacts")}
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
              icon="map"
              label={t("home_map")}
              color={AppColors.dark}
              isHighlighted={highlightedButton === 3}
              onPress={() => navigateTo("/map")}
              onLongPress={() => speakButton(3, "home_desc_map")}
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
    gap: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  grid: {
    flex: 1,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.xl,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.lg,
  },
});
