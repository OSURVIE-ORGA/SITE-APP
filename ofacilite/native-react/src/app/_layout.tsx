import { AppColors } from "@/constants/theme";
import i18n from "@/i18n";
import NotificationService from "@/services/notification-service";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
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

  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data?.type === "medication"
    ) {
      const medName = lastNotificationResponse.notification.request.content.data?.name as string | undefined;
      setTimeout(() => {
        router.push({
          pathname: "/medication-check",
          params: { name: medName },
        });
      }, 100);
    }
  }, [lastNotificationResponse, router]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      if (notification.request.content.data?.type === "medication") {
        const medName = notification.request.content.data?.name as string;
        router.push({
          pathname: "/medication-check",
          params: { name: medName },
        });
      }
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="light" {...(Platform.OS === "android" ? { backgroundColor: AppColors.dark } : {})} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.cream },
        }}
      >
        <Stack.Screen
          name="medication-check"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
      </Stack>
    </I18nextProvider>
  );
}
