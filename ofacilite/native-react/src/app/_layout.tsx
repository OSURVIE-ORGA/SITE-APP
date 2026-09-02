import { AppColors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/auth-context";
import i18n from "@/i18n";
import NotificationService from "@/services/notification-service";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { Platform } from "react-native";

SplashScreen.preventAutoHideAsync();

/** Redirige vers /login sans jeton, vers l'app avec jeton. */
function AuthGate() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLogin = segments[0] === "login";
    if (!token && !onLogin) router.replace("/login");
    else if (token && onLogin) router.replace("/");
  }, [token, loading, segments, router]);

  return null;
}

function RootNavigator() {
  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    NotificationService.instance.init();
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!lastNotificationResponse) return;
    const data = lastNotificationResponse.notification.request.content.data;
    if (data?.type === "medication") {
      const medName = data?.name as string | undefined;
      setTimeout(() => {
        router.push({ pathname: "/medication-check", params: { name: medName } });
      }, 100);
    } else if (data?.type === "message") {
      setTimeout(() => router.push("/(tabs)/messages"), 100);
    }
  }, [lastNotificationResponse, router]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (notification.request.content.data?.type === "medication") {
          const medName = notification.request.content.data?.name as string;
          router.push({
            pathname: "/medication-check",
            params: { name: medName },
          });
        }
      },
    );
    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.cream },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen
          name="medication-check"
          options={{ presentation: "fullScreenModal", animation: "fade" }}
        />
        <Stack.Screen
          name="emergency"
          options={{ presentation: "fullScreenModal", animation: "fade" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar
        style="light"
        {...(Platform.OS === "android"
          ? { backgroundColor: AppColors.dark }
          : {})}
      />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </I18nextProvider>
  );
}
