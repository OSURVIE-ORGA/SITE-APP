import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null = null;
let initPromise: Promise<void> | null = null;

function getNotificationsModule(): NotificationsModule | null {
  if (isWeb) {
    return null;
  }

  if (!notificationsModule) {
    try {
      // Charge le module seulement sur une build native supportée.
      notificationsModule = require("expo-notifications") as NotificationsModule;
    } catch (error) {
      console.warn("Failed to load expo-notifications (running in Expo Go):", error);
      return null;
    }
  }

  return notificationsModule;
}

// Configure le comportement de notification quand l'app est au premier plan
const notifications = getNotificationsModule();

if (notifications) {
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Service de notifications locales — équivalent du NotificationService Flutter.
 */
class NotificationService {
  private static _instance: NotificationService;

  static get instance(): NotificationService {
    if (!NotificationService._instance) {
      NotificationService._instance = new NotificationService();
    }
    return NotificationService._instance;
  }

  /** Demande les permissions de notification */
  async init(): Promise<void> {
    if (initPromise) {
      return initPromise;
    }

    const notifications = getNotificationsModule();
    if (!notifications) return;

    initPromise = (async () => {
      try {
        if (Platform.OS === "android") {
          await notifications.setNotificationChannelAsync(
            "medication_channel",
            {
              name: "Médicaments",
              importance: notifications.AndroidImportance.HIGH,
            },
          );
          await notifications.setNotificationChannelAsync(
            "appointment_channel",
            {
              name: "Rendez-vous",
              importance: notifications.AndroidImportance.HIGH,
            },
          );
        }

        const { status: existingStatus } =
          await notifications.getPermissionsAsync();
        if (existingStatus !== "granted") {
          await notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
        }
      } catch (error) {
        console.warn(
          "Erreur lors de l'initialisation des notifications :",
          error,
        );
      }
    })();

    return initPromise;
  }

  private async ensureReady(): Promise<NotificationsModule | null> {
    await this.init();
    return getNotificationsModule();
  }

  /** Programme une notification quotidienne (médicament) */
  async scheduleDaily(
    id: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
  ): Promise<string> {
    const notifications = await this.ensureReady();
    if (!notifications) return "0";

    return notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        sound: true,
        priority: notifications.AndroidNotificationPriority.HIGH,
        data: { type: "medication", name: body },
        ...(Platform.OS === "android" && { channelId: "medication_channel" }),
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  /** Programme une notification unique (rendez-vous) */
  async scheduleOnce(
    id: string,
    title: string,
    body: string,
    date: Date,
  ): Promise<string | null> {
    const notifications = await this.ensureReady();
    if (!notifications || date.getTime() <= Date.now()) return null;
    return notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        sound: true,
        priority: notifications.AndroidNotificationPriority.HIGH,
        data: { type: "appointment", body },
        ...(Platform.OS === "android" && { channelId: "appointment_channel" }),
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DATE,
        date: date.getTime(),
      },
    });
  }

  /** Annule une notification programmée */
  async cancel(id: string): Promise<void> {
    const notifications = getNotificationsModule();
    if (!notifications) return;
    await notifications.cancelScheduledNotificationAsync(id);
  }

  /** Annule toutes les notifications */
  async cancelAll(): Promise<void> {
    const notifications = getNotificationsModule();
    if (!notifications) return;
    await notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default NotificationService;
