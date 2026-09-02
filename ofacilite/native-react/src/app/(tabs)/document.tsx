import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import AccessibleButton from "@/components/accessible-button";
import VoiceInput from "@/components/voice-input";
import {
    AppColors,
    BorderColor,
    BorderRadius,
    FontSizes,
    MutedColor,
    Spacing,
} from "@/constants/theme";
import ApiService, { type AskTurn } from "@/services/api-service";
import TtsService from "@/services/tts-service";
import { useAutoTTS } from "@/hooks/useAutoTTS";

type Mode = "menu" | "photo" | "question";

export default function ComprendreScreen() {
  const [mode, setMode] = useState<Mode>("menu");

  useAutoTTS("understand_tts_intro");

  return (
    <View style={styles.shell}>
      <View style={styles.backgroundAccent} />
      {mode === "menu" && <ModeMenu onPick={setMode} />}
      {mode === "photo" && <PhotoMode onBack={() => setMode("menu")} />}
      {mode === "question" && <QuestionMode onBack={() => setMode("menu")} />}
    </View>
  );
}

/* ─────────────────────────── Menu ─────────────────────────── */

function ModeMenu({ onPick }: { onPick: (m: Mode) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.menu}>
      <AccessibleButton
        description={t("understand_desc_mode_photo")}
        onTap={() => {
          TtsService.instance.stop();
          onPick("photo");
        }}
      >
        <View style={styles.menuCard}>
          <Ionicons name="document-text" size={48} color={AppColors.white} />
          <Text style={styles.menuCardText}>{t("understand_mode_photo")}</Text>
        </View>
      </AccessibleButton>

      <AccessibleButton
        description={t("understand_desc_mode_question")}
        onTap={() => {
          TtsService.instance.stop();
          onPick("question");
        }}
      >
        <View style={styles.menuCard}>
          <Ionicons
            name="chatbubble-ellipses"
            size={48}
            color={AppColors.white}
          />
          <Text style={styles.menuCardText}>
            {t("understand_mode_question")}
          </Text>
        </View>
      </AccessibleButton>
    </View>
  );
}

/* ────────────────────────── Photo / fichier ────────────────────────── */

// Chargé à la demande : le module natif n'existe qu'après un rebuild.
// Avant, "Choisir un fichier" est indisponible mais photo/galerie marchent.
type DocumentPickerModule = typeof import("expo-document-picker");
function loadDocumentPicker(): DocumentPickerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-document-picker") as DocumentPickerModule;
  } catch {
    return null;
  }
}

function mimeFromName(name: string): string {
  const ext = /\.(\w+)$/.exec(name)?.[1]?.toLowerCase() ?? "jpg";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

function PhotoMode({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "pdf">("image");
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  const [failDetail, setFailDetail] = useState("");
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(
      () => setDotCount((c) => (c === 3 ? 1 : c + 1)),
      600,
    );
    return () => clearInterval(interval);
  }, [loading]);

  const dots = ".".repeat(dotCount);

  const analyze = async (uri: string, mime: string, name: string) => {
    setFileUri(uri);
    setFileKind(mime === "application/pdf" ? "pdf" : "image");
    setFileName(name);
    setSummary(null);
    setFailed(false);
    setFailMsg("");
    setFailDetail("");
    setLoading(true);

    const res = await ApiService.instance.readDocument(uri, mime, i18n.language);
    setLoading(false);
    await TtsService.instance.stop();

    if ("answer" in res) {
      setSummary(res.answer);
      await TtsService.instance.speak(res.answer);
      return;
    }

    setFailed(true);
    const msg =
      res.error === "timeout"
        ? t("document_too_slow")
        : res.error === "http"
          ? t("help_answer_error")
          : t("document_summary_offline");
    setFailMsg(msg);
    const label =
      res.error === "http" ? `HTTP ${res.status}` : res.error;
    setFailDetail(res.detail ? `${label} — ${res.detail}` : label);
    await TtsService.instance.speak(msg);
  };

  const pickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name = asset.fileName ?? asset.uri.split("/").pop() ?? "photo.jpg";
    await analyze(asset.uri, mimeFromName(name), name);
  };

  const pickFile = async () => {
    const DocumentPicker = loadDocumentPicker();
    if (!DocumentPicker) {
      await TtsService.instance.speak(t("document_summary_offline"));
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? mimeFromName(asset.name);
    await analyze(asset.uri, mime, asset.name);
  };

  const reset = () => {
    TtsService.instance.stop();
    setFileUri(null);
    setSummary(null);
    setLoading(false);
    setFailed(false);
    setFailMsg("");
    setFailDetail("");
  };

  if (!fileUri) {
    return (
      <View style={styles.pickerContainer}>
        <BackArrow onBack={onBack} />
        <AccessibleButton
          description={t("document_desc_take_photo")}
          onTap={() => pickImage(true)}
        >
          <View style={styles.primaryButton}>
            <Ionicons name="camera" size={36} color={AppColors.white} />
            <Text style={styles.primaryButtonText}>
              {t("document_take_photo")}
            </Text>
          </View>
        </AccessibleButton>

        <AccessibleButton
          description={t("document_desc_gallery")}
          onTap={() => pickImage(false)}
        >
          <View style={styles.outlinedButton}>
            <Ionicons name="images" size={28} color={AppColors.primary} />
            <Text style={styles.outlinedButtonText}>
              {t("document_gallery")}
            </Text>
          </View>
        </AccessibleButton>

        <AccessibleButton
          description={t("understand_desc_choose_file")}
          onTap={pickFile}
        >
          <View style={styles.outlinedButton}>
            <Ionicons
              name="document-attach"
              size={28}
              color={AppColors.primary}
            />
            <Text style={styles.outlinedButtonText}>
              {t("understand_choose_file")}
            </Text>
          </View>
        </AccessibleButton>
      </View>
    );
  }

  return (
    <View style={styles.resultContainer}>
      <BackArrow onBack={onBack} />
      {fileKind === "image" ? (
        <Image source={{ uri: fileUri }} style={styles.imagePreview} />
      ) : (
        <View style={styles.pdfPreview}>
          <Ionicons name="document-text" size={48} color={AppColors.dark} />
          <Text style={styles.pdfName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>
            {t("document_loading_label")}
            {dots}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {summary ? (
            <>
              <View style={styles.textBox}>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  {t("understand_disclaimer")}
                </Text>
              </View>
            </>
          ) : (
            failed && (
              <View style={styles.offlineRow}>
                <Ionicons name="cloud-offline" size={14} color="#BBBBBB" />
                <Text style={styles.offlineText}>
                  {failMsg || t("document_summary_offline")}
                  {failDetail ? `  (${failDetail})` : ""}
                </Text>
              </View>
            )
          )}

          <AccessibleButton
            description={
              fileKind === "image"
                ? t("document_desc_new_photo")
                : t("help_retry")
            }
            onTap={reset}
          >
            <View style={[styles.primaryButton, { marginTop: Spacing.xxl }]}>
              <Ionicons name="refresh" size={24} color={AppColors.white} />
              <Text style={styles.primaryButtonText}>
                {fileKind === "image"
                  ? t("document_new_photo")
                  : t("help_retry")}
              </Text>
            </View>
          </AccessibleButton>
        </ScrollView>
      )}
    </View>
  );
}

/* ───────────────────────── Question ───────────────────────── */

function QuestionMode({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();

  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (text: string) => {
    const q = text.trim();
    if (!q || isAsking) return;

    const prior = turns;
    setQuestion("");
    setFailed(false);
    setTurns([...prior, { role: "user", content: q }]);
    setIsAsking(true);

    // On envoie les tours précédents : l'IA garde le fil des questions de suivi.
    const result = await ApiService.instance.ask(q, i18n.language, prior);
    setIsAsking(false);

    if (result) {
      setTurns((cur) => [...cur, { role: "assistant", content: result }]);
      await TtsService.instance.stop();
      await TtsService.instance.speak(result);
    } else {
      setFailed(true);
    }
  };

  const newConversation = () => {
    TtsService.instance.stop();
    setQuestion("");
    setTurns([]);
    setFailed(false);
    setIsAsking(false);
  };

  const changeQuestion = (text: string) => {
    setQuestion(text);
    if (failed) setFailed(false);
  };

  const canSend = question.trim().length > 0 && !isAsking;
  const hasAnswer = turns.some((x) => x.role === "assistant");

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Voix d'abord — c'est l'entrée principale pour un non-lecteur */}
        <VoiceInput lang={i18n.language} disabled={isAsking} onResult={submit} />

      {/* Repli clavier pour ceux qui savent écrire */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.questionInput}
          placeholder={t("help_question_placeholder")}
          placeholderTextColor={MutedColor}
          value={question}
          onChangeText={changeQuestion}
          multiline
          textAlignVertical="top"
          editable={!isAsking}
        />
      </View>

      {/* Bouton toujours monté (sinon le clavier se ferme à la 1re lettre) */}
      <Pressable
        style={[styles.askButton, !canSend && styles.askButtonDisabled]}
        onPress={() => submit(question)}
        disabled={!canSend}
      >
        <Ionicons name="send" size={22} color={AppColors.white} />
        <Text style={styles.askButtonText}>{t("help_ask_button")}</Text>
      </Pressable>

      {isAsking && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.loadingRowText}>{t("voice_thinking")}</Text>
        </View>
      )}

      {/* Fil de la conversation — l'IA se souvient des tours précédents */}
      {turns.map((turn, i) =>
        turn.role === "user" ? (
          <View key={i} style={styles.userBubble}>
            <Text style={styles.userBubbleText}>{turn.content}</Text>
          </View>
        ) : (
          <View key={i} style={styles.answerBox}>
            <Text style={styles.answerText}>{turn.content}</Text>
          </View>
        ),
      )}

      {hasAnswer && (
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>{t("understand_disclaimer")}</Text>
        </View>
      )}

      {failed && (
        <View style={styles.errorRow}>
          <Ionicons name="cloud-offline" size={16} color={MutedColor} />
          <Text style={styles.errorText}>{t("help_answer_error")}</Text>
        </View>
      )}

      {turns.length > 0 && (
        <Pressable style={styles.retryButton} onPress={newConversation}>
          <Ionicons name="refresh" size={20} color={AppColors.primary} />
          <Text style={styles.retryText}>{t("help_retry")}</Text>
        </Pressable>
      )}
      </ScrollView>
      <BackArrow onBack={onBack} />
    </View>
  );
}

/* ───────────────────────── Shared ───────────────────────── */

/** Grosse flèche retour, en haut à gauche, visible en permanence. */
function BackArrow({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.backArrowWrap}>
      <AccessibleButton
        description={t("document_desc_back")}
        onTap={() => {
          TtsService.instance.stop();
          onBack();
        }}
      >
        <View style={styles.backArrow}>
          <Ionicons name="arrow-back" size={28} color={AppColors.white} />
        </View>
      </AccessibleButton>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  backgroundAccent: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(79,140,255,0.10)",
  },
  menu: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    backgroundColor: AppColors.dark,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    minHeight: 120,
    elevation: 6,
    shadowColor: "#06101E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
  },
  menuCardText: {
    fontSize: FontSizes.xxl,
    fontWeight: "800",
    color: AppColors.white,
    flexShrink: 1,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.xl,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    backgroundColor: AppColors.dark,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    width: "100%",
    minHeight: 80,
  },
  primaryButtonText: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: AppColors.white,
  },
  outlinedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: BorderColor,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    width: "100%",
    minHeight: 60,
  },
  outlinedButtonText: {
    fontSize: FontSizes.lg,
    color: AppColors.primary,
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  imagePreview: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },
  pdfPreview: {
    width: "100%",
    height: 140,
    backgroundColor: "#EADEC9",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  pdfName: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: AppColors.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xxxl,
    paddingHorizontal: Spacing.xxxl,
  },
  loadingText: {
    fontSize: FontSizes.xxl,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "center",
    lineHeight: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  textBox: {
    padding: Spacing.lg,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: BorderColor,
    shadowColor: "#0A1630",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  summaryText: {
    fontSize: FontSizes.lg,
    lineHeight: 28,
    color: AppColors.text,
  },
  offlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  offlineText: {
    fontSize: FontSizes.xs,
    color: MutedColor,
  },
  questionScroll: {
    flex: 1,
  },
  questionContent: {
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  inputContainer: {
    width: "100%",
  },
  questionInput: {
    borderWidth: 1.5,
    borderColor: BorderColor,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    fontSize: FontSizes.lg,
    color: AppColors.text,
    backgroundColor: AppColors.white,
    minHeight: 90,
    textAlignVertical: "top",
  },
  askButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.dark,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    width: "100%",
    minHeight: 56,
  },
  askButtonDisabled: {
    opacity: 0.4,
  },
  askButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: AppColors.white,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingRowText: {
    fontSize: FontSizes.md,
    color: MutedColor,
  },
  answerBox: {
    width: "100%",
    padding: Spacing.lg,
    backgroundColor: "#EAF7EE",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#A9DDB5",
  },
  answerText: {
    fontSize: FontSizes.lg,
    color: "#14532D",
    lineHeight: 26,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AppColors.dark,
    borderRadius: BorderRadius.xl,
  },
  userBubbleText: {
    fontSize: FontSizes.md,
    color: AppColors.white,
    lineHeight: 22,
  },
  disclaimerBox: {
    width: "100%",
    padding: Spacing.md,
    backgroundColor: "#FFF8E8",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#F2C46D",
  },
  disclaimerText: {
    fontSize: FontSizes.sm,
    color: "#7C5A00",
    lineHeight: 20,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: MutedColor,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  retryText: {
    fontSize: FontSizes.lg,
    color: AppColors.primary,
    fontWeight: "700",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  backLinkText: {
    fontSize: FontSizes.md,
    color: AppColors.dark,
    fontWeight: "700",
  },
  backArrowWrap: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 10,
  },
  backArrow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.dark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: AppColors.white,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
