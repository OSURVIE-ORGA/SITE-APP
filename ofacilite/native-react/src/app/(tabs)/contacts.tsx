import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts/legacy";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, BorderColor, FontSizes, MutedColor, Spacing } from "@/constants/theme";
import { addContact, AppContact, deleteContact, getContacts, updateContactPhoto } from "@/services/database";
import TtsService from "@/services/tts-service";
import { useAutoTTS } from "@/hooks/useAutoTTS";

export default function ContactsScreen() {
  const { t, i18n } = useTranslation();

  const [contacts, setContacts] = useState<AppContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<Contacts.ExistingContact[]>([]);

  useAutoTTS("contacts_tts_intro");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const data = await getContacts();
    setContacts(data);
    setLoading(false);
  };

  const handleImportFromPhone = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        setPhoneContacts(
          data
            .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
        setShowImportDialog(true);
      }
    } else {
      alert(t("contacts_no_permission"));
    }
  };

  const selectPhoneContact = (contact: Contacts.ExistingContact) => {
    setNewName(contact.name || "");
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      setNewPhone(contact.phoneNumbers[0].number || "");
    }
    setShowImportDialog(false);
  };

  const handleAddContact = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const id = Date.now().toString();
    await addContact(id, newName.trim(), newPhone.trim(), newPhoto);
    setNewName("");
    setNewPhone("");
    setNewPhoto(null);
    setShowAddDialog(false);
    await loadContacts();
  };

  const pickPhoto = async (forNewContact = false, contactId?: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;

    if (forNewContact) {
      setNewPhoto(uri);
    } else if (contactId) {
      await updateContactPhoto(contactId, uri);
      await loadContacts();
    }
  };

  const callContact = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleDeleteContact = async (contactId: string) => {
    await deleteContact(contactId);
    await loadContacts();
  };

  const renderDeleteAction = () => (
    <View style={styles.deleteAction}>
      <Ionicons name="trash" size={32} color={AppColors.white} />
    </View>
  );

  const renderContact = useCallback(
    ({ item }: { item: AppContact }) => {
      const avatarUri = item.photoPath;
      const initial = item.name[0]?.toUpperCase() || "?";

      return (
        <Swipeable
          renderRightActions={renderDeleteAction}
          onSwipeableOpen={(dir) => {
            if (dir === "right") {
              handleDeleteContact(item.id);
            }
          }}
        >
          <AccessibleButton
            description={t("contacts_desc_call", { name: item.name })}
            onTap={() => callContact(item.phone)}
          >
            <View style={styles.contactRow}>
              <AccessibleButton
                description={t("contacts_desc_edit_photo", {
                  name: item.name,
                })}
                onTap={() => pickPhoto(false, item.id)}
              >
                <View>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
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

              <View style={styles.callButton}>
                <Ionicons name="call" size={18} color={AppColors.dark} />
                <Text style={styles.callButtonText}>{t("contacts_call")}</Text>
              </View>
            </View>
          </AccessibleButton>
        </Swipeable>
      );
    },
    [t, callContact, pickPhoto],
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {contacts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>{t("contacts_empty")}</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        <Pressable
          style={styles.fab}
          onPress={() => setShowAddDialog(true)}
          accessibilityLabel={t("contacts_add")}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={36} color={AppColors.dark} />
        </Pressable>

        {/* Add Contact Modal */}
        <Modal visible={showAddDialog} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("contacts_add_title")}</Text>

              <Pressable
                style={styles.importButton}
                onPress={handleImportFromPhone}
              >
                <Ionicons name="download" size={24} color={AppColors.white} />
                <Text style={styles.importButtonText}>{t("contacts_import")}</Text>
              </Pressable>

              <Pressable
                style={styles.newPhotoContainer}
                onPress={() => pickPhoto(true)}
              >
                {newPhoto ? (
                  <Image source={{ uri: newPhoto }} style={styles.newAvatar} />
                ) : (
                  <View style={styles.newAvatarPlaceholder}>
                    <Ionicons name="camera" size={32} color={AppColors.white} />
                  </View>
                )}
                <Text style={styles.newPhotoText}>{t("contacts_choose_photo")}</Text>
              </Pressable>

              <Text style={styles.inputLabel}>{t("contacts_name")}</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder={t("contacts_name_placeholder")}
                placeholderTextColor={MutedColor}
              />

              <Text style={styles.inputLabel}>{t("contacts_phone")}</Text>
              <TextInput
                style={styles.input}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="06..."
                placeholderTextColor={MutedColor}
                keyboardType="phone-pad"
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalButtonCancel}
                  onPress={() => setShowAddDialog(false)}
                >
                  <Text style={styles.modalButtonCancelText}>
                    {t("health_cancel")}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.modalButtonSave}
                  onPress={handleAddContact}
                >
                  <Text style={styles.modalButtonSaveText}>
                    {t("health_save")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Import from Phone Modal */}
        <Modal visible={showImportDialog} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { flex: 0.8 }]}>
              <Text style={styles.modalTitle}>{t("contacts_select_import")}</Text>
              <FlatList
                data={phoneContacts}
                keyExtractor={(item) => item.id || Math.random().toString()}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.phoneContactRow}
                    onPress={() => selectPhoneContact(item)}
                  >
                    <Text style={styles.phoneContactName}>{item.name}</Text>
                    <Text style={styles.phoneContactNumber}>
                      {item.phoneNumbers?.[0]?.number}
                    </Text>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              <Pressable
                style={[styles.modalButtonCancel, { alignSelf: "flex-end", marginTop: Spacing.md }]}
                onPress={() => setShowImportDialog(false)}
              >
                <Text style={styles.modalButtonCancelText}>
                  {t("health_cancel")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
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
    paddingBottom: 100, // For FAB
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
  deleteAction: {
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xl,
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
  separator: {
    height: 0,
    marginVertical: 0,
  },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: AppColors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: AppColors.cream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: Spacing.sm,
  },
  newPhotoContainer: {
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  newAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  newAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MutedColor,
    justifyContent: "center",
    alignItems: "center",
  },
  newPhotoText: {
    fontSize: FontSizes.md,
    color: AppColors.primary,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: AppColors.text,
  },
  input: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: BorderColor,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.lg,
    color: AppColors.text,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButtonCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  modalButtonCancelText: {
    fontSize: FontSizes.lg,
    color: MutedColor,
    fontWeight: "600",
  },
  modalButtonSave: {
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  modalButtonSaveText: {
    fontSize: FontSizes.lg,
    color: AppColors.white,
    fontWeight: "bold",
  },
  importButton: {
    backgroundColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  importButtonText: {
    fontSize: FontSizes.lg,
    color: AppColors.white,
    fontWeight: "bold",
  },
  phoneContactRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BorderColor,
  },
  phoneContactName: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: AppColors.text,
  },
  phoneContactNumber: {
    fontSize: FontSizes.md,
    color: MutedColor,
    marginTop: 4,
  },
});
