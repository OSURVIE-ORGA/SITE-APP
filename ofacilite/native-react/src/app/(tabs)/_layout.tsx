import { AppColors, MutedColor } from "@/constants/theme";
import SosButton from "@/components/sos-button";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const tabBarHeight = 70 + insets.bottom;

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: AppColors.dark,
          },
          headerTintColor: AppColors.white,
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 20,
            letterSpacing: 0.2,
          },
          tabBarActiveTintColor: AppColors.primary,
          tabBarInactiveTintColor: MutedColor,
          tabBarStyle: {
            backgroundColor: "rgba(92,61,30,0.96)",
            borderTopColor: "rgba(255,255,255,0.08)",
            paddingBottom: 8 + insets.bottom,
            height: tabBarHeight,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("nav_home"),
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="document"
          options={{
            title: t("nav_understand"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: t("nav_call"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="call" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: t("nav_health"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: t("nav_findhelp"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="location" size={size} color={color} />
            ),
          }}
        />
        {/* "help" route retired — its question feature moved into "document"
            (Comprendre), its emergency calls into the global SOS button. */}
      </Tabs>

      <SosButton bottomOffset={tabBarHeight + 12} />
    </>
  );
}
