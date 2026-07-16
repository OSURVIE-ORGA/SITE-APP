import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    StyleSheet,
    Text,
    View
} from "react-native";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, BorderColor, FontSizes, MutedColor, Spacing } from "@/constants/theme";
import { getPhotoForContact, savePhotoForContact } from "@/services/database";
import TtsService from "@/services/tts-service";

interface ContactWithPhoto {
  id: string;
  name: string;
  firstName: string;
  initial: string;
  phone: string;
  photo?: string | null;
  localPhoto?: string | null;
}

export default function ContactsScreen() {
  const { t, i18n } = useTranslation();

  const [contacts, setContacts] = useState<ContactWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);

  useEffect(() => {
    TtsService.instance.init(i18n.language);
    const timer = setTimeout(() => {
      TtsService.instance.speak(t("contacts_tts_intro"));
    }, 800);
    loadContacts();
    return () => {
      clearTimeout(timer);
      TtsService.instance.stop();
    };
  }, []);

  const fetchContacts = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      });

      const withPhone = data.filter(
        (c) => c.phoneNumbers && c.phoneNumbers.length > 0,
      );

      const mapped: ContactWithPhoto[] = [];
      for (const c of withPhone) {
        const name = c.name || "?";
        const firstName = name.split(" ")[0];
        const initial = name[0]?.toUpperCase() || "?";
        const phone = c.phoneNumbers![0].number || "";
        const photo = c.image?.uri || null;
        const localPhoto = c.id ? await getPhotoForContact(c.id) : null;

        mapped.push({
          id: c.id || String(Math.random()),
          name,
          firstName,
          initial,
          phone,
          photo,
          localPhoto,
        });
      }

      setContacts(mapped);
      setPermissionDenied(false);
    } catch (err) {
      console.warn("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    const { status: initialStatus, canAskAgain: initialCanAsk } =
      await Contacts.getPermissionsAsync();

    if (initialStatus === "granted") {
      await fetchContacts();
      return;
    }

    if (initialCanAsk) {
      const { status: newStatus, canAskAgain: newCanAsk } =
        await Contacts.requestPermissionsAsync();
      setCanAskAgain(newCanAsk);
      if (newStatus === "granted") {
        await fetchContacts();
        return;
      }
    } else {
      setCanAskAgain(false);
    }

    setPermissionDenied(true);
    setLoading(false);
  };

  const callContact = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const sendPhoto = useCallback(async (contact: ContactWithPhoto) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(result.assets[0].uri);
    }
  }, []);

  const changePhoto = useCallback(async (contact: ContactWithPhoto) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    await savePhotoForContact(contact.id, uri);
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, localPhoto: uri } : c)),
    );
  }, []);

  const renderContact = useCallback(
    ({ item }: { item: ContactWithPhoto }) => {
      const avatarUri = item.localPhoto || item.photo;

      return (
        <View style={styles.contactRow}>
          <AccessibleButton
            description={t("contacts_desc_edit_photo", {
              name: item.firstName,
            })}
            onTap={() => changePhoto(item)}
          >
            <View>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{item.initial}</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={10} color="#555555" />
              </View>
            </View>
          </AccessibleButton>

          <Text style={styles.contactName} numberOfLines={1}>
            {item.name}
          </Text>

          <AccessibleButton
            description={t("contacts_desc_call", { name: item.firstName })}
            onTap={() => callContact(item.phone)}
          >
            <View style={styles.callButton}>
              <Ionicons name="call" size={18} color={AppColors.dark} />
              <Text style={styles.callButtonText}>{t("contacts_call")}</Text>
            </View>
          </AccessibleButton>

          <AccessibleButton
            description={t("contacts_desc_photo", { name: item.firstName })}
            onTap={() => sendPhoto(item)}
          >
            <View style={styles.photoButton}>
              <Ionicons name="camera" size={18} color={AppColors.white} />
              <Text style={styles.photoButtonText}>{t("contacts_photo")}</Text>
            </View>
          </AccessibleButton>
        </View>
      );
    },
    [t, callContact, sendPhoto, changePhoto],
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="people-outline"
          size={72}
          color={MutedColor}
          style={{ marginBottom: Spacing.md }}
        />
        <Text
          style={[
            styles.emptyText,
            {
              marginBottom: Spacing.lg,
              textAlign: "center",
              paddingHorizontal: Spacing.md,
            },
          ]}
        >
          {t("contacts_no_permission")}
        </Text>
        {!canAskAgain && (
          <AccessibleButton
            description={t("contacts_desc_open_settings")}
            onTap={() => Linking.openSettings()}
          >
            <View style={styles.openSettingsButton}>
              <Ionicons name="settings" size={20} color={AppColors.white} />
              <Text style={styles.openSettingsButtonText}>
                {t("contacts_open_settings")}
              </Text>
            </View>
          </AccessibleButton>
        )}
      </View>
    );
  }

  if (contacts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{t("contacts_empty")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={contacts}
      keyExtractor={(item) => item.id}
      renderItem={renderContact}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      style={{ backgroundColor: AppColors.cream }}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.cream,
  },
  emptyText: {
    fontSize: FontSizes.xl,
    color: MutedColor,
  },
  listContent: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  contactRow: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: BorderColor,
    shadowColor: "#0A1630",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: "bold",
    color: AppColors.white,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: BorderColor,
  },
  contactName: {
    flex: 1,
    fontSize: FontSizes.xxl,
    fontWeight: "600",
    color: AppColors.text,
    marginLeft: Spacing.sm,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EADEC9",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  callButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: AppColors.primary,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: AppColors.dark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  photoButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: AppColors.white,
  },
  separator: {
    height: 0,
    marginVertical: 0,
  },
  openSettingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  openSettingsButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: AppColors.white,
  },
});
