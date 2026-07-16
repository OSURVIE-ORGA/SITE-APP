import { AppColors } from "@/constants/theme";
import i18n from "@/i18n";
import NotificationService from "@/services/notification-service";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { Platform } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    NotificationService.instance.init();
    SplashScreen.hideAsync();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="light" {...(Platform.OS === "android" ? { backgroundColor: AppColors.dark } : {})} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.cream },
        }}
      />
    </I18nextProvider>
  );
}
