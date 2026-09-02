import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useAutoTTS } from "@/hooks/useAutoTTS";
import TtsService from "@/services/tts-service";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useAutoTTS("login_intro");

  const submit = async () => {
    if (code.trim().length < 4 || busy) return;
    setBusy(true);
    setError(null);
    TtsService.instance.stop();
    try {
      await signIn(code.trim());
    } catch {
      setError(t("login_error"));
      TtsService.instance.speak(t("login_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brand}>
        <View style={styles.brandDot} />
        <Text style={styles.brandName}>{t("home_title")}</Text>
      </View>

      <View style={styles.body}>
        <Ionicons name="person-circle" size={80} color={AppColors.dark} />
        <Text style={styles.label}>{t("login_field")}</Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 16))}
          keyboardType="number-pad"
          inputMode="numeric"
          autoFocus
          placeholder="— — — —"
          placeholderTextColor={AppColors.dark + "55"}
          onSubmitEditing={submit}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[
            styles.button,
            (busy || code.trim().length < 4) && styles.buttonDisabled,
          ]}
          onPress={submit}
          disabled={busy || code.trim().length < 4}
        >
          {busy ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <>
              <Ionicons name="log-in" size={26} color={AppColors.white} />
              <Text style={styles.buttonText}>{t("login_button")}</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.cream,
    paddingHorizontal: Spacing.xl,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
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
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  label: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: AppColors.text,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: AppColors.white,
    borderWidth: 2,
    borderColor: AppColors.dark,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 8,
    textAlign: "center",
    color: AppColors.text,
  },
  error: {
    fontSize: FontSizes.md,
    color: AppColors.red,
    fontWeight: "700",
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
    minHeight: 64,
    backgroundColor: AppColors.dark,
    borderRadius: BorderRadius.full,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    fontSize: FontSizes.xxl,
    fontWeight: "800",
    color: AppColors.white,
  },
});
