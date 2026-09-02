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
    updateAppointment,
    updateAppointmentNotificationId,
    updateMedicationNotificationId,
    updateMedication,
    deleteMedicationTimes,
} from "@/services/database";
import NotificationService from "@/services/notification-service";
import TtsService from "@/services/tts-service";
import { useAutoTTS } from "@/hooks/useAutoTTS";
import ApiService from "@/services/api-service";
import VoiceInput from "@/components/voice-input";

type TabName = "medications" | "appointments";

type MedVoiceStep = "name" | "freq" | "dur";
type ApptVoiceStep = "reason" | "doctor" | "day" | "time";

const MED_VOICE_QUESTION: Record<MedVoiceStep, string> = {
  name: "health_voice_ask_name",
  freq: "health_voice_ask_frequency",
  dur: "health_voice_ask_duration",
};

const APPT_VOICE_QUESTION: Record<ApptVoiceStep, string> = {
  reason: "health_voice_ask_reason",
  doctor: "health_voice_ask_doctor",
  day: "health_voice_ask_day",
  time: "health_voice_ask_time",
};

const NUM_WORDS: Record<string, number> = {
  // français
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
  quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30,
  // anglais
  one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, once: 1, twice: 2,
  // arabe (formes normalisées : sans harakat, alef unifié, ة→ه, ى→ي)
  صفر: 0, واحد: 1, واحده: 1, مره: 1, اثنان: 2, اثنين: 2, مرتين: 2, ثنتين: 2,
  ثلاثه: 3, ثلاث: 3, اربعه: 4, اربع: 4, خمسه: 5, خمس: 5, سته: 6, ست: 6,
  سبعه: 7, سبع: 7, ثمانيه: 8, ثماني: 8, تسعه: 9, تسع: 9, عشره: 10, عشر: 10,
  // ordinaux arabes de l'heure ("الساعة الثانية" = 2h)
  الواحده: 1, الثانيه: 2, الثالثه: 3, الرابعه: 4, الخامسه: 5, السادسه: 6,
  السابعه: 7, الثامنه: 8, التاسعه: 9, العاشره: 10,
};

const WEEKDAYS: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  الاحد: 0, الاثنين: 1, الثلاثا: 2, الاربعا: 3, الخميس: 4, الجمعه: 5,
  السبت: 6,
};

const MONTHS: Record<string, number> = {
  janvier: 0, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5, juillet: 6,
  aout: 7, septembre: 8, octobre: 9, novembre: 10, decembre: 11,
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6,
  august: 7, september: 8, october: 9, november: 10, december: 11,
  يناير: 0, فبراير: 1, مارس: 2, ابريل: 3, مايو: 4, يونيو: 5, يوليو: 6,
  اغسطس: 7, سبتمبر: 8, اكتوبر: 9, نوفمبر: 10, ديسمبر: 11,
};

/** minuscules, sans diacritiques, séparateurs -> espaces, lettres arabes unifiées. */
function normalizeNum(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ءؤئـ]/g, "")
    .replace(/[-_/'’.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordNum(w: string | undefined): number | null {
  if (!w) return null;
  if (/^\d+$/.test(w)) return parseInt(w, 10);
  return Object.prototype.hasOwnProperty.call(NUM_WORDS, w) ? NUM_WORDS[w] : null;
}

/** Date dictée -> Date (à minuit). "demain", "lundi", "le 12 mars", "غدا"… */
function parseSpokenDate(text: string, now = new Date()): Date | null {
  const s = normalizeNum(text);
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const plus = (n: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d;
  };

  if (/\baujourd\b|\btoday\b|اليوم/.test(s)) return base;
  if (/apres demain|after tomorrow|بعد غد|بعد بكره/.test(s)) return plus(2);
  if (/\bdemain\b|\btomorrow\b|غدا|بكره/.test(s)) return plus(1);
  if (/يومين/.test(s)) return plus(2);

  const rel = s.match(/(?:dans|in|بعد)\s+([\p{L}\d]+)\s*(?:jours?|days?|ايام|يوم)/u);
  if (rel) return plus(wordNum(rel[1]) ?? 1);

  const tok = s.split(" ");
  const hasMonth = tok.some((w) => w in MONTHS);
  for (let i = 0; i < tok.length - 1; i++) {
    const day = wordNum(tok[i]);
    const mo = MONTHS[tok[i + 1]];
    if (day != null && mo != null && day >= 1 && day <= 31) {
      const d = new Date(base.getFullYear(), mo, day);
      if (d < base) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }
  for (const w of tok) {
    const dow = WEEKDAYS[w];
    if (dow != null) {
      let add = (dow - base.getDay() + 7) % 7;
      if (add === 0) add = 7;
      return plus(add);
    }
  }
  const bare = s.match(/(?:\ble\b\s*)?(\d{1,2})/);
  if (bare && !hasMonth) {
    const day = parseInt(bare[1], 10);
    if (day >= 1 && day <= 31) {
      const d = new Date(base.getFullYear(), base.getMonth(), day);
      if (d < base) d.setMonth(d.getMonth() + 1);
      return d;
    }
  }
  return null;
}

/** Heure dictée -> {hour, minute}. "14h30", "9 heures et demie", "الساعة الثانية"… */
function parseSpokenTime(text: string): { hour: number; minute: number } | null {
  const s = normalizeNum(text).replace(/apres midi/g, " pm ").replace(/\s+/g, " ").trim();
  if (/\bmidi\b|\bnoon\b|الظهر/.test(s)) return { hour: 12, minute: 0 };
  if (/\bminuit\b|\bmidnight\b|منتصف الليل/.test(s)) return { hour: 0, minute: 0 };

  let hour: number | null = null;
  let minute = 0;
  let m =
    s.match(/(\d{1,2})\s*(?:h|:|heures?|hr)\s*(\d{1,2})\b/) ||
    s.match(/(\d{1,2})\s+(\d{2})\b/);
  if (m) {
    hour = +m[1];
    minute = +m[2];
  } else {
    m = s.match(/(\d{1,2})\s*(?:h\b|heures?|hr\b)/);
    if (m) hour = +m[1];
    else {
      m = s.match(/الساعه\s+([\p{L}]+|\d{1,2})/u);
      if (m) hour = wordNum(m[1]);
      else {
        const dm = s.match(/\b(\d{1,2})\b/);
        if (dm) hour = +dm[1];
        else
          for (const w of s.split(" ")) {
            const v = wordNum(w);
            if (v != null && v >= 0 && v <= 23) {
              hour = v;
              break;
            }
          }
      }
    }
  }
  if (hour == null || isNaN(hour)) return null;

  if (minute === 0) {
    if (/et demie|et demi|half past|النصف|و نصف/.test(s)) minute = 30;
    else if (/et quart|quarter past|و ربع|الربع/.test(s)) minute = 15;
    else if (/moins le quart|quarter to|الا ربع/.test(s)) {
      minute = 45;
      hour = (hour + 23) % 24;
    }
  }
  if (/du soir|\bpm\b|مساء|عصرا|ليلا|الليل/.test(s) && hour >= 1 && hour <= 11) {
    hour += 12;
  }
  if (/du matin|\bam\b|صباحا|الصباح/.test(s) && hour === 12) hour = 0;

  return {
    hour: ((hour % 24) + 24) % 24,
    minute: Math.min(59, Math.max(0, minute)),
  };
}

/** "3" / "trois" / "٣" / "ثلاث مرات" / "deux semaines" / "شهر" -> nombre. */
function parseSpokenNumber(input: string): number | null {
  const ascii = input
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
  const digits = ascii.match(/\d+/);
  if (digits) return parseInt(digits[0], 10);

  const norm = normalizeNum(input);

  // 1) un éventuel nombre écrit en lettres (fr / en / ar) — découpe qui GARDE
  //    les lettres arabes (contrairement à [^a-z]).
  let n: number | null = null;
  for (const w of norm.replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/)) {
    if (w && Object.prototype.hasOwnProperty.call(NUM_WORDS, w)) {
      n = NUM_WORDS[w];
      break;
    }
  }

  // 2) unité de temps -> multiplicateur (français + arabe, y compris duels/pluriels)
  if (/اسابيع|اسبوعين|اسبوع|semaines?/.test(norm)) {
    return (n ?? (/اسبوعين/.test(norm) ? 2 : 1)) * 7;
  }
  if (/شهور|اشهر|شهرين|شهر|mois/.test(norm)) {
    return (n ?? (/شهرين/.test(norm) ? 2 : 1)) * 30;
  }

  return n;
}

/** Heures de prise par défaut pour N prises / jour. */
function defaultHours(count: number): number[] {
  const n = Math.max(1, Math.min(6, count));
  const table: Record<number, number[]> = {
    1: [8],
    2: [8, 20],
    3: [8, 13, 20],
    4: [8, 12, 16, 20],
    5: [8, 12, 15, 18, 21],
    6: [7, 11, 14, 17, 20, 23],
  };
  return table[n];
}

export default function HealthScreen() {
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabName>("medications");
  const [medications, setMedications] = useState<MedicationWithTimes[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showMedVoice, setShowMedVoice] = useState(false);
  const [medVoiceStep, setMedVoiceStep] = useState<MedVoiceStep>("name");
  const [showApptVoice, setShowApptVoice] = useState(false);
  const [apptVoiceStep, setApptVoiceStep] = useState<ApptVoiceStep>("reason");

  // Dialog states
  const [showMedDialog, setShowMedDialog] = useState(false);

  const [showApptDialog, setShowApptDialog] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [medName, setMedName] = useState("");
  const [medTimes, setMedTimes] = useState<{ hour: number; minute: number }[]>([
    { hour: 8, minute: 0 },
  ]);
  const [medFrequency, setMedFrequency] = useState("");
  const [medDuration, setMedDuration] = useState("");
  const [medPhoto, setMedPhoto] = useState<string | null>(null);
  const [editingApptId, setEditingApptId] = useState<number | null>(null);
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

  // ── Ajout d'un médicament à la voix, champ par champ ─────────────

  // À chaque étape, la question est posée à voix haute.
  useEffect(() => {
    if (!showMedVoice) return;
    const id = setTimeout(() => {
      TtsService.instance.speak(t(MED_VOICE_QUESTION[medVoiceStep]));
    }, 350);
    return () => clearTimeout(id);
  }, [showMedVoice, medVoiceStep, t]);

  const startMedVoice = () => {
    setEditingMedId(null);
    setMedName("");
    setMedFrequency("");
    setMedDuration("");
    setMedTimes([{ hour: 8, minute: 0 }]);
    setMedPhoto(null);
    setMedVoiceStep("name");
    setShowMedVoice(true);
  };

  const handleMedVoice = (transcript: string) => {
    const said = transcript.trim();
    if (!said) return;

    if (medVoiceStep === "name") {
      setMedName(said);
      setMedVoiceStep("freq");
      return;
    }

    if (medVoiceStep === "freq") {
      const n = parseSpokenNumber(said);
      if (n == null || n < 1) {
        TtsService.instance.speak(t("voice_not_understood"));
        return;
      }
      const count = Math.max(1, Math.min(6, n));
      setMedFrequency(String(count));
      setMedTimes(defaultHours(count).map((h) => ({ hour: h, minute: 0 })));
      setMedVoiceStep("dur");
      return;
    }

    // dur : un nombre, ou "je ne sais pas" -> pas de durée
    const days = parseSpokenNumber(said);
    setMedDuration(days != null && days > 0 ? String(days) : "");
    setShowMedVoice(false);
    setShowMedDialog(true);
    setTimeout(() => TtsService.instance.speak(t("health_voice_review")), 300);
  };

  // ── Ajout d'un rendez-vous à la voix, champ par champ ────────────

  useEffect(() => {
    if (!showApptVoice) return;
    const id = setTimeout(() => {
      TtsService.instance.speak(t(APPT_VOICE_QUESTION[apptVoiceStep]));
    }, 350);
    return () => clearTimeout(id);
  }, [showApptVoice, apptVoiceStep, t]);

  const startApptVoice = () => {
    setEditingApptId(null);
    setApptReason("");
    setApptDoctor("");
    setApptDate(new Date());
    setApptVoiceStep("reason");
    setShowApptVoice(true);
  };

  const handleApptVoice = (transcript: string) => {
    const said = transcript.trim();
    if (!said) return;

    if (apptVoiceStep === "reason") {
      setApptReason(said);
      setApptVoiceStep("doctor");
      return;
    }
    if (apptVoiceStep === "doctor") {
      setApptDoctor(said);
      setApptVoiceStep("day");
      return;
    }
    if (apptVoiceStep === "day") {
      const d = parseSpokenDate(said);
      if (!d) {
        TtsService.instance.speak(t("voice_not_understood"));
        return;
      }
      setApptDate((prev) => {
        const next = new Date(d);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
        return next;
      });
      setApptVoiceStep("time");
      return;
    }

    // time
    const hm = parseSpokenTime(said);
    if (!hm) {
      TtsService.instance.speak(t("voice_not_understood"));
      return;
    }
    setApptDate((prev) => {
      const next = new Date(prev);
      next.setHours(hm.hour, hm.minute, 0, 0);
      return next;
    });
    setShowApptVoice(false);
    setShowApptDialog(true);
    setTimeout(() => TtsService.instance.speak(t("health_voice_review")), 300);
  };

  // ── Scanner ──────────────────────────────────────────────────────

  const takePhotoAndScan = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert(t("health_no_permission", "Permission d'accès à la caméra refusée"));
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    
    if (activeTab === "medications") {
      setEditingMedId(null);
      setIsScanning(true);
      try {
        const scanResult = await ApiService.instance.scanMedicationPhoto(uri);
        if (scanResult && scanResult.success) {
          setMedName(scanResult.name || "");
          // Local file URI, not scanResult.photoUrl: the API deletes the
          // uploaded copy after a day.
          setMedPhoto(uri);
          if (scanResult.durationDays) {
            setMedDuration(scanResult.durationDays.toString());
          } else {
            setMedDuration("");
          }

          if (scanResult.suggestedHours && scanResult.suggestedHours.length > 0) {
            setMedFrequency(scanResult.suggestedHours.length.toString());
            setMedTimes(scanResult.suggestedHours.map((h) => ({ hour: h, minute: 0 })));
          } else if (scanResult.frequency) {
            setMedFrequency(scanResult.frequency.toString());
            const count = Math.max(1, Math.min(6, scanResult.frequency));
            const hours = count === 1 ? [8] : count === 2 ? [8, 20] : count === 3 ? [8, 13, 20] : [8, 12, 16, 20];
            setMedTimes(hours.slice(0, count).map((h) => ({ hour: h, minute: 0 })));
          } else {
            setMedFrequency("1");
            setMedTimes([{ hour: 8, minute: 0 }]);
          }
        } else {
          setMedPhoto(uri);
          setMedName("");
          setMedFrequency("1");
          setMedDuration("");
          setMedTimes([{ hour: 8, minute: 0 }]);
        }
      } catch (err) {
        console.error("Error scanning medication:", err);
        setMedPhoto(uri);
        setMedName("");
        setMedFrequency("1");
        setMedDuration("");
        setMedTimes([{ hour: 8, minute: 0 }]);
      } finally {
        setIsScanning(false);
        setShowMedDialog(true);
      }
    } else {
      setEditingApptId(null);
      setApptReason("");
      setApptDoctor("");
      setApptDate(new Date());
      setShowApptDialog(true);
    }
  };


  // ── Medications ──────────────────────────────────────────────────

  const handleAddMedication = async () => {
    if (!medName.trim()) return;
    setShowMedDialog(false);

    const durationNum = parseInt(medDuration);
    const validDuration = !isNaN(durationNum) && durationNum > 0 ? durationNum : undefined;
    
    let medId = editingMedId;

    if (medId) {
      await updateMedication(medId, medName.trim(), medPhoto, validDuration);
      for (let i = 0; i < 6; i++) {
        await NotificationService.instance.cancel(`med_${medId}_${i}`);
      }
      await deleteMedicationTimes(medId);
    } else {
      const startDate = Date.now();
      medId = await addMedication(medName.trim(), medPhoto, "", startDate, validDuration);
    }

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
    setEditingMedId(null);
    setMedName("");
    setMedFrequency("");
    setMedDuration("");
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

  const handleSaveAppointment = async () => {
    if (!apptReason.trim() || !apptDoctor.trim()) return;
    setShowApptDialog(false);

    const dateTime = new Date(apptDate);
    const reason = apptReason.trim();
    const doctor = apptDoctor.trim();
    const body = `${doctor} — ${reason}`;

    let apptId = editingApptId;
    if (apptId) {
      await NotificationService.instance.cancel(`appt_${apptId}_eve`);
      await NotificationService.instance.cancel(`appt_${apptId}_soon`);
      await NotificationService.instance.cancel(`appt_${apptId}_actual`);
      await updateAppointment(apptId, reason, doctor, dateTime);
    } else {
      apptId = await addAppointment(reason, doctor, dateTime, "");
    }

    // Notification veille (18h)
    const dayBefore = new Date(dateTime);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(18, 0, 0, 0);
    await NotificationService.instance.scheduleOnce(
      `appt_${apptId}_eve`,
      t("health_notif_appt_eve"),
      body,
      dayBefore,
    );

    // Notification 1h avant
    await NotificationService.instance.scheduleOnce(
      `appt_${apptId}_soon`,
      t("health_notif_appt_soon"),
      body,
      new Date(dateTime.getTime() - 3600000),
    );

    // Notification à l'heure du rendez-vous
    await NotificationService.instance.scheduleOnce(
      `appt_${apptId}_actual`,
      t("health_notif_appt_actual"),
      body,
      dateTime,
    );

    await updateAppointmentNotificationId(apptId, `appt_${apptId}`);
    setEditingApptId(null);
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

      let remainingDaysLabel = null;
      if (item.medication.startDate && item.medication.durationDays) {
        const start = new Date(item.medication.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + item.medication.durationDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          remainingDaysLabel = t("health_med_remaining", { days: diffDays });
        } else {
          remainingDaysLabel = t("health_med_finished");
        }
      }

      return (
        <Swipeable
          renderRightActions={renderDeleteAction}
          onSwipeableOpen={() => handleDeleteMedication(item)}
        >
          <Pressable
            onPress={() => {
              setEditingMedId(item.medication.id);
              setMedName(item.medication.name);
              setMedFrequency(item.times.length.toString());
              setMedDuration(item.medication.durationDays ? item.medication.durationDays.toString() : "");
              setMedTimes(item.times.map(t => ({ hour: t.hour, minute: t.minute })));
              setMedPhoto(item.medication.photoPath);
              setShowMedDialog(true);
            }}
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
              {remainingDaysLabel ? (
                <Text style={[styles.cardSubtitle, { color: AppColors.primary, fontWeight: 'bold' }]}>
                  {remainingDaysLabel}
                </Text>
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
            onPress={() => {
              setEditingApptId(item.id);
              setApptReason(item.title);
              setApptDoctor(item.doctorName);
              setApptDate(new Date(item.scheduledAt));
              setShowApptDialog(true);
            }}
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
                ? t("health_desc_voice_add")
                : t("health_desc_voice_appt")
            }
            onTap={activeTab === "medications" ? startMedVoice : startApptVoice}
          >
            <View style={styles.voiceFab}>
              <Ionicons name="mic" size={26} color={AppColors.white} />
            </View>
          </AccessibleButton>

          <AccessibleButton
            description={t("health_desc_scan")}
            onTap={takePhotoAndScan}
          >
            <View style={styles.scanFab}>
              <Ionicons name="scan" size={28} color={AppColors.white} />
            </View>
          </AccessibleButton>

          <AccessibleButton
            description={
              activeTab === "medications"
                ? t("health_desc_fab_med")
                : t("health_desc_fab_appt")
            }
            onTap={() => {
              if (activeTab === "medications") {
                setEditingMedId(null);
                setMedName("");
                setMedFrequency("");
                setMedDuration("");
                setMedTimes([{ hour: 8, minute: 0 }]);
                setMedPhoto(null);
                setShowMedDialog(true);
              } else {
                setEditingApptId(null);
                setApptReason("");
                setApptDoctor("");
                setApptDate(new Date());
                setShowApptDialog(true);
              }
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
                {editingMedId ? t("health_edit_medication") : t("health_add_medication")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("health_med_name")}
                value={medName}
                onChangeText={setMedName}
                autoCapitalize="sentences"
              />
              <TextInput
                style={styles.input}
                placeholder={t("health_med_frequency")}
                value={medFrequency}
                onChangeText={(text) => {
                  setMedFrequency(text);
                  const num = parseInt(text);
                  if (!isNaN(num) && num > 0 && num <= 6) {
                    if (num > medTimes.length) {
                      const newTimes = [...medTimes];
                      for (let i = medTimes.length; i < num; i++) {
                        newTimes.push({ hour: 12, minute: 0 });
                      }
                      setMedTimes(newTimes);
                    } else if (num < medTimes.length) {
                      setMedTimes(medTimes.slice(0, num));
                    }
                  }
                }}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder={t("health_med_duration")}
                value={medDuration}
                onChangeText={setMedDuration}
                keyboardType="numeric"
              />
              <Text style={{ fontSize: FontSizes.md, color: AppColors.text, marginTop: Spacing.sm }}>
                {t("health_med_times")}
              </Text>
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
                </View>
              ))}
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

        {/* Add / Edit Appointment Dialog */}
        <Modal visible={showApptDialog} transparent animationType="fade">
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>
                {editingApptId
                  ? t("health_edit_appointment")
                  : t("health_add_appointment")}
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
                <Pressable
                  onPress={() => {
                    setShowApptDialog(false);
                    setEditingApptId(null);
                  }}
                >
                  <Text style={styles.cancelText}>{t("health_cancel")}</Text>
                </Pressable>
                <Pressable
                  style={styles.saveButton}
                  onPress={handleSaveAppointment}
                >
                  <Text style={styles.saveButtonText}>{t("health_save")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Ajout médicament à la voix — champ par champ */}
        <Modal visible={showMedVoice} transparent animationType="fade">
          <View style={styles.dialogBackdrop}>
            <View style={[styles.dialog, { alignItems: "center" }]}>
              <Text style={styles.dialogTitle}>{t("health_add_medication")}</Text>
              <Text
                style={{
                  fontSize: FontSizes.lg,
                  fontWeight: "700",
                  color: AppColors.text,
                  textAlign: "center",
                  marginBottom: Spacing.md,
                }}
              >
                {t(MED_VOICE_QUESTION[medVoiceStep])}
              </Text>

              <VoiceInput lang={i18n.language} onResult={handleMedVoice} />

              <Pressable
                style={{
                  marginTop: Spacing.md,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.xl,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1.5,
                  borderColor: BorderColor,
                }}
                onPress={() => {
                  TtsService.instance.stop();
                  setShowMedVoice(false);
                }}
              >
                <Text style={styles.cancelText}>{t("health_cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Ajout rendez-vous à la voix — champ par champ */}
        <Modal visible={showApptVoice} transparent animationType="fade">
          <View style={styles.dialogBackdrop}>
            <View style={[styles.dialog, { alignItems: "center" }]}>
              <Text style={styles.dialogTitle}>
                {t("health_add_appointment")}
              </Text>
              <Text
                style={{
                  fontSize: FontSizes.lg,
                  fontWeight: "700",
                  color: AppColors.text,
                  textAlign: "center",
                  marginBottom: Spacing.md,
                }}
              >
                {t(APPT_VOICE_QUESTION[apptVoiceStep])}
              </Text>

              <VoiceInput lang={i18n.language} onResult={handleApptVoice} />

              <Pressable
                style={{
                  marginTop: Spacing.md,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.xl,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1.5,
                  borderColor: BorderColor,
                }}
                onPress={() => {
                  TtsService.instance.stop();
                  setShowApptVoice(false);
                }}
              >
                <Text style={styles.cancelText}>{t("health_cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Scanning Loading Modal */}
        <Modal visible={isScanning} transparent animationType="fade">
          <View style={styles.dialogBackdrop}>
            <View style={[styles.dialog, { alignItems: 'center', padding: Spacing.xl }]}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <Text style={{ marginTop: Spacing.lg, fontSize: FontSizes.md, fontWeight: 'bold', textAlign: 'center', color: AppColors.text }}>
                {t("document_analyzing")}
              </Text>
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
    alignItems: "center",
    gap: Spacing.md,
  },
  scanFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.dark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  voiceFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.dark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
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
