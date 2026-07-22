import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import {
    GestureHandlerRootView,
    Swipeable,
} from "react-native-gesture-handler";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, BorderColor, FontSizes, MutedColor, Spacing } from "@/constants/theme";
import {
    addAppointment,
    addMedication,
    addMedicationTime,
    Appointment,
    deleteAppointment,
    deleteMedication,
    getMedicationsWithTimes,
    getUpcomingAppointments,
    MedicationWithTimes,
    updateAppointmentNotificationId,
    updateMedicationNotificationId,
} from "@/services/database";
import NotificationService from "@/services/notification-service";
import TtsService from "@/services/tts-service";
import { useAutoTTS } from "@/hooks/useAutoTTS";

type TabName = "medications" | "appointments";

export default function HealthScreen() {
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabName>("medications");
  const [medications, setMedications] = useState<MedicationWithTimes[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showMedDialog, setShowMedDialog] = useState(false);
  const [showApptDialog, setShowApptDialog] = useState(false);
  const [medName, setMedName] = useState("");
  const [medTimes, setMedTimes] = useState<{ hour: number; minute: number }[]>([
    { hour: 8, minute: 0 },
  ]);
  const [medPhoto, setMedPhoto] = useState<string | null>(null);
  const [apptReason, setApptReason] = useState("");
  const [apptDoctor, setApptDoctor] = useState("");
  const [apptDate, setApptDate] = useState<Date>(new Date());

  // Picker states
  const [showMedTimePicker, setShowMedTimePicker] = useState<number | null>(
    null,
  );
  const [showApptDatePicker, setShowApptDatePicker] = useState(false);
  const [showApptTimePicker, setShowApptTimePicker] = useState(false);

  useAutoTTS("health_tts_intro");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const meds = await getMedicationsWithTimes();
    const appts = await getUpcomingAppointments();
    setMedications(meds);
    setAppointments(appts);
    setLoading(false);
  };

  // ── Medications ──────────────────────────────────────────────────

  const handleAddMedication = async () => {
    if (!medName.trim()) return;
    setShowMedDialog(false);

    const medId = await addMedication(medName.trim(), medPhoto, "");

    for (let i = 0; i < medTimes.length; i++) {
      await addMedicationTime(medId, medTimes[i].hour, medTimes[i].minute);
      const notifId = `med_${medId}_${i}`;
      await NotificationService.instance.scheduleDaily(
        notifId,
        t("health_notif_med"),
        medName.trim(),
        medTimes[i].hour,
        medTimes[i].minute,
      );
    }

    await updateMedicationNotificationId(medId, `med_${medId}`);
    setMedName("");
    setMedTimes([{ hour: 8, minute: 0 }]);
    setMedPhoto(null);
    await loadData();
  };

  const handleDeleteMedication = async (mwt: MedicationWithTimes) => {
    for (let i = 0; i < mwt.times.length; i++) {
      await NotificationService.instance.cancel(
        `med_${mwt.medication.id}_${i}`,
      );
    }
    await deleteMedication(mwt.medication.id);
    await loadData();
  };

  // ── Appointments ──────────────────────────────────────────────────

  const handleAddAppointment = async () => {
    if (!apptReason.trim() || !apptDoctor.trim()) return;
    setShowApptDialog(false);

    const dateTime = new Date(apptDate);

    const apptId = await addAppointment(
      apptReason.trim(),
      apptDoctor.trim(),
      dateTime,
      "",
    );

    const body = `${apptDoctor.trim()} — ${apptReason.trim()}`;

    // Notification veille (18h)
    const dayBefore = new Date(dateTime);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(18, 0, 0, 0);
    const notifEve = `appt_${apptId}_eve`;
    await NotificationService.instance.scheduleOnce(
      notifEve,
      t("health_notif_appt_eve"),
      body,
      dayBefore,
    );

    // Notification 1h avant
    const hourBefore = new Date(dateTime.getTime() - 3600000);
    const notifSoon = `appt_${apptId}_soon`;
    await NotificationService.instance.scheduleOnce(
      notifSoon,
      t("health_notif_appt_soon"),
      body,
      hourBefore,
    );

    // Notification à l'heure du rendez-vous
    const notifActual = `appt_${apptId}_actual`;
    await NotificationService.instance.scheduleOnce(
      notifActual,
      t("health_notif_appt_actual"),
      body,
      dateTime,
    );

    await updateAppointmentNotificationId(apptId, `appt_${apptId}`);
    setApptReason("");
    setApptDoctor("");
    setApptDate(new Date());
    await loadData();
  };

  const handleDeleteAppointment = async (appt: Appointment) => {
    await NotificationService.instance.cancel(`appt_${appt.id}_eve`);
    await NotificationService.instance.cancel(`appt_${appt.id}_soon`);
    await NotificationService.instance.cancel(`appt_${appt.id}_actual`);
    await deleteAppointment(appt.id);
    await loadData();
  };

  // ── Render ──────────────────────────────────────────────────────

  const renderDeleteAction = () => (
    <View style={styles.deleteAction}>
      <Ionicons name="trash" size={32} color={AppColors.white} />
    </View>
  );

  const renderMedication = useCallback(
    ({ item }: { item: MedicationWithTimes }) => {
      const timesLabel = item.times
        .map(
          (t) =>
            `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`,
        )
        .join(" • ");
      const timesTts = item.times
        .map(
          (t) =>
            `${String(t.hour).padStart(2, "0")}h${String(t.minute).padStart(2, "0")}`,
        )
        .join(", ");

      return (
        <Swipeable
          renderRightActions={renderDeleteAction}
          onSwipeableOpen={() => handleDeleteMedication(item)}
        >
          <Pressable
            onLongPress={() =>
              TtsService.instance.speak(
                t("health_desc_med", {
                  name: item.medication.name,
                  times: timesTts,
                }),
              )
            }
            style={styles.card}
          >
            <View style={styles.medAvatar}>
              {item.medication.photoPath ? (
                <Image
                  source={{ uri: item.medication.photoPath }}
                  style={styles.medAvatarImage}
                />
              ) : (
                <View style={styles.medAvatarPlaceholder}>
                  <Ionicons name="medkit" size={24} color={AppColors.dark} />
                </View>
              )}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.medication.name}</Text>
              {timesLabel ? (
                <Text style={styles.cardSubtitle}>{timesLabel}</Text>
              ) : null}
            </View>
          </Pressable>
        </Swipeable>
      );
    },
    [t],
  );

  const renderAppointment = useCallback(
    ({ item }: { item: Appointment }) => {
      const dt = new Date(item.scheduledAt);
      const dateLabel = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
      const timeLabel = `${String(dt.getHours()).padStart(2, "0")}h${String(dt.getMinutes()).padStart(2, "0")}`;

      return (
        <Swipeable
          renderRightActions={renderDeleteAction}
          onSwipeableOpen={() => handleDeleteAppointment(item)}
        >
          <Pressable
            onLongPress={() =>
              TtsService.instance.speak(
                t("health_desc_appt", {
                  doctor: item.doctorName,
                  reason: item.title,
                  date: dateLabel,
                  time: timeLabel,
                }),
              )
            }
            style={styles.card}
          >
            <View style={styles.medAvatarPlaceholder}>
              <Ionicons name="calendar" size={24} color={AppColors.dark} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.doctorName}</Text>
              <Text style={styles.cardSubtitle}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {dateLabel} à {timeLabel}
              </Text>
            </View>
          </Pressable>
        </Swipeable>
      );
    },
    [t],
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
        <View style={styles.backgroundAccentTop} />
        <View style={styles.backgroundAccentBottom} />
        {/* Tabs */}
        <View style={styles.tabBar}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "medications" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("medications")}
            onLongPress={() =>
              TtsService.instance.speak(t("health_desc_tab_med"))
            }
          >
            <Ionicons
              name="medkit"
              size={20}
              color={
                activeTab === "medications"
                  ? AppColors.white
                  : "rgba(255,255,255,0.6)"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "medications" && styles.activeTabText,
              ]}
            >
              {t("health_tab_medications")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "appointments" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("appointments")}
            onLongPress={() =>
              TtsService.instance.speak(t("health_desc_tab_appt"))
            }
          >
            <Ionicons
              name="calendar"
              size={20}
              color={
                activeTab === "appointments"
                  ? AppColors.white
                  : "rgba(255,255,255,0.6)"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "appointments" && styles.activeTabText,
              ]}
            >
              {t("health_tab_appointments")}
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {activeTab === "medications" ? (
          medications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit" size={72} color={AppColors.primary} />
              <Text style={styles.emptyText}>{t("health_no_medications")}</Text>
            </View>
          ) : (
            <FlatList
              data={medications}
              keyExtractor={(item) => String(item.medication.id)}
              renderItem={renderMedication}
              contentContainerStyle={styles.listContent}
            />
          )
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar" size={72} color={AppColors.primary} />
            <Text style={styles.emptyText}>{t("health_no_appointments")}</Text>
          </View>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderAppointment}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* FAB */}
        <View style={styles.fabContainer}>
          <AccessibleButton
            description={
              activeTab === "medications"
                ? t("health_desc_fab_med")
                : t("health_desc_fab_appt")
            }
            onTap={() => {
              if (activeTab === "medications") setShowMedDialog(true);
              else setShowApptDialog(true);
            }}
          >
            <View style={styles.fab}>
              <Ionicons name="add" size={32} color={AppColors.dark} />
            </View>
          </AccessibleButton>
        </View>

        {/* Add Medication Dialog */}
        <Modal visible={showMedDialog} transparent animationType="fade">
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>
                {t("health_add_medication")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("health_med_name")}
                value={medName}
                onChangeText={setMedName}
                autoCapitalize="sentences"
              />
              {medTimes.map((time, i) => (
                <View key={i} style={styles.timeRow}>
                  <Ionicons name="time" size={20} color={AppColors.text} />
                  {Platform.OS === "android" ? (
                    <Pressable
                      style={[
                        styles.input,
                        { flex: 1, justifyContent: "center" },
                      ]}
                      onPress={() => setShowMedTimePicker(i)}
                    >
                      <Text
                        style={{
                          fontSize: FontSizes.lg,
                          color: AppColors.text,
                        }}
                      >
                        {`${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`}
                      </Text>
                    </Pressable>
                  ) : (
                    <DateTimePicker
                      style={{ flex: 1 }}
                      value={(() => {
                        const d = new Date();
                        d.setHours(time.hour, time.minute, 0, 0);
                        return d;
                      })()}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(e, d) => {
                        if (d) {
                          setMedTimes((prev) =>
                            prev.map((t, idx) =>
                              idx === i
                                ? { hour: d.getHours(), minute: d.getMinutes() }
                                : t,
                            ),
                          );
                        }
                      }}
                    />
                  )}
                  {Platform.OS === "android" && showMedTimePicker === i && (
                    <DateTimePicker
                      value={(() => {
                        const d = new Date();
                        d.setHours(time.hour, time.minute, 0, 0);
                        return d;
                      })()}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(e, d) => {
                        setShowMedTimePicker(null);
                        if (d) {
                          setMedTimes((prev) =>
                            prev.map((t, idx) =>
                              idx === i
                                ? { hour: d.getHours(), minute: d.getMinutes() }
                                : t,
                            ),
                          );
                        }
                      }}
                    />
                  )}
                  {medTimes.length > 1 && (
                    <Pressable
                      onPress={() =>
                        setMedTimes((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={24}
                        color={AppColors.red}
                      />
                    </Pressable>
                  )}
                </View>
              ))}
              {medTimes.length < 6 && (
                <Pressable
                  onPress={() =>
                    setMedTimes((prev) => [...prev, { hour: 12, minute: 0 }])
                  }
                  style={styles.addTimeButton}
                >
                  <Ionicons name="add" size={18} color={AppColors.primary} />
                  <Text style={styles.addTimeText}>{t("health_add_time")}</Text>
                </Pressable>
              )}
              <View style={styles.photoRow}>
                <Pressable
                  style={styles.photoPickerButton}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets?.[0])
                      setMedPhoto(result.assets[0].uri);
                  }}
                >
                  <Ionicons name="images" size={18} color={AppColors.text} />
                  <Text>{t("health_gallery")}</Text>
                </Pressable>
                <Pressable
                  style={styles.photoPickerButton}
                  onPress={async () => {
                    const result = await ImagePicker.launchCameraAsync({
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets?.[0])
                      setMedPhoto(result.assets[0].uri);
                  }}
                >
                  <Ionicons name="camera" size={18} color={AppColors.text} />
                  <Text>{t("health_camera")}</Text>
                </Pressable>
              </View>
              {medPhoto && (
                <Text style={styles.photoSelected}>
                  {t("health_photo_selected")}
                </Text>
              )}
              <View style={styles.dialogActions}>
                <Pressable onPress={() => setShowMedDialog(false)}>
                  <Text style={styles.cancelText}>{t("health_cancel")}</Text>
                </Pressable>
                <Pressable
                  style={styles.saveButton}
                  onPress={handleAddMedication}
                >
                  <Text style={styles.saveButtonText}>{t("health_save")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Appointment Dialog */}
        <Modal visible={showApptDialog} transparent animationType="fade">
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>
                {t("health_add_appointment")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("health_appt_reason")}
                value={apptReason}
                onChangeText={setApptReason}
                autoCapitalize="sentences"
              />
              <TextInput
                style={styles.input}
                placeholder={t("health_doctor_name")}
                value={apptDoctor}
                onChangeText={setApptDoctor}
                autoCapitalize="words"
              />
              {/* Date Picker */}
              {Platform.OS === "android" ? (
                <Pressable
                  style={[styles.input, { justifyContent: "center" }]}
                  onPress={() => setShowApptDatePicker(true)}
                >
                  <Text
                    style={{ fontSize: FontSizes.lg, color: AppColors.text }}
                  >
                    {`${String(apptDate.getDate()).padStart(2, "0")}/${String(apptDate.getMonth() + 1).padStart(2, "0")}/${apptDate.getFullYear()}`}
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: FontSizes.lg,
                      color: AppColors.text,
                      opacity: 0.5,
                    }}
                  >
                    Date
                  </Text>
                  <DateTimePicker
                    value={apptDate}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                      if (d) {
                        const current = new Date(apptDate);
                        current.setFullYear(
                          d.getFullYear(),
                          d.getMonth(),
                          d.getDate(),
                        );
                        setApptDate(current);
                      }
                    }}
                  />
                </View>
              )}
              {Platform.OS === "android" && showApptDatePicker && (
                <DateTimePicker
                  value={apptDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowApptDatePicker(false);
                    if (d) {
                      const current = new Date(apptDate);
                      current.setFullYear(
                        d.getFullYear(),
                        d.getMonth(),
                        d.getDate(),
                      );
                      setApptDate(current);
                    }
                  }}
                />
              )}

              {/* Time Picker */}
              {Platform.OS === "android" ? (
                <Pressable
                  style={[styles.input, { justifyContent: "center" }]}
                  onPress={() => setShowApptTimePicker(true)}
                >
                  <Text
                    style={{ fontSize: FontSizes.lg, color: AppColors.text }}
                  >
                    {`${String(apptDate.getHours()).padStart(2, "0")}:${String(apptDate.getMinutes()).padStart(2, "0")}`}
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: FontSizes.lg,
                      color: AppColors.text,
                      opacity: 0.5,
                    }}
                  >
                    Heure
                  </Text>
                  <DateTimePicker
                    value={apptDate}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(e, d) => {
                      if (d) {
                        const current = new Date(apptDate);
                        current.setHours(d.getHours(), d.getMinutes());
                        setApptDate(current);
                      }
                    }}
                  />
                </View>
              )}
              {Platform.OS === "android" && showApptTimePicker && (
                <DateTimePicker
                  value={apptDate}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(e, d) => {
                    setShowApptTimePicker(false);
                    if (d) {
                      const current = new Date(apptDate);
                      current.setHours(d.getHours(), d.getMinutes());
                      setApptDate(current);
                    }
                  }}
                />
              )}
              <View style={styles.dialogActions}>
                <Pressable onPress={() => setShowApptDialog(false)}>
                  <Text style={styles.cancelText}>{t("health_cancel")}</Text>
                </Pressable>
                <Pressable
                  style={styles.saveButton}
                  onPress={handleAddAppointment}
                >
                  <Text style={styles.saveButtonText}>{t("health_save")}</Text>
                </Pressable>
              </View>
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
  backgroundAccentTop: {
    position: "absolute",
    top: -90,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(79,140,255,0.10)",
  },
  backgroundAccentBottom: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: "rgba(244,197,66,0.10)",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.cream,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: AppColors.dark,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xxl,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
    borderRadius: BorderRadius.xl,
  },
  activeTab: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  tabText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  activeTabText: {
    color: AppColors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.xl,
    color: MutedColor,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: Spacing.md,
    paddingBottom: 120,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs + 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: BorderColor,
  },
  medAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  medAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  medAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: AppColors.dark,
  },
  cardSubtitle: {
    fontSize: FontSizes.md,
    color: MutedColor,
    marginTop: 2,
  },
  cardDate: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: AppColors.primary,
    marginTop: 2,
  },
  deleteAction: {
    backgroundColor: AppColors.red,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: Spacing.xs + 2,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  fabContainer: {
    position: "absolute",
    bottom: Spacing.xxl,
    right: Spacing.xxl,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  // Dialog styles
  dialogBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(6,16,30,0.55)",
    padding: Spacing.xxl,
  },
  dialog: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: BorderColor,
  },
  dialogTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: AppColors.dark,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: BorderColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSizes.lg,
    backgroundColor: "#FBFCFE",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  addTimeText: {
    color: AppColors.primary,
    fontSize: FontSizes.sm,
    fontWeight: "700",
  },
  photoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  photoPickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: BorderColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    backgroundColor: "#FBFCFE",
  },
  photoSelected: {
    color: AppColors.primary,
    fontSize: FontSizes.sm,
    fontWeight: "700",
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSizes.md,
    color: MutedColor,
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "bold",
    color: AppColors.white,
  },
});
