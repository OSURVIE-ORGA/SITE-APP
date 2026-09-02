import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import VoiceInput from "@/components/voice-input";
import {
  AppColors,
  BorderColor,
  BorderRadius,
  FontSizes,
  MutedColor,
  Spacing,
} from "@/constants/theme";
import { useAutoTTS } from "@/hooks/useAutoTTS";
import ApiService, { ChatMessage } from "@/services/api-service";
import TtsService from "@/services/tts-service";

export default function MessagesScreen() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useAutoTTS("messages_intro_tts");

  const load = useCallback(async () => {
    const data = await ApiService.instance.getMessages();
    if (data) setMessages(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), 12000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const created = await ApiService.instance.sendMessage(body);
    if (created) {
      setMessages((prev) => [...prev, created]);
    } else {
      setText(body); // échec : on rend le texte à la personne
    }
    setSending(false);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = !item.fromAdmin;
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        <View
          style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}
        >
          {!mine && (
            <Text style={styles.author}>{t("messages_admin_label")}</Text>
          )}
          <Text style={[styles.body, mine && styles.bodyMine]}>{item.body}</Text>
          {!mine && (
            <Pressable
              style={styles.listen}
              onPress={() => TtsService.instance.speak(item.body)}
              accessibilityRole="button"
              accessibilityLabel={t("messages_listen")}
            >
              <Ionicons name="volume-high" size={22} color={AppColors.dark} />
              <Text style={styles.listenText}>{t("messages_listen")}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color={AppColors.primary}
          style={styles.loader}
        />
      ) : messages.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={72} color={MutedColor} />
          <Text style={styles.emptyText}>{t("messages_empty")}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      <View style={styles.composer}>
        <VoiceInput
          lang={i18n.language}
          disabled={sending}
          onResult={(tx) => setText((p) => (p ? `${p} ${tx}` : tx))}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t("messages_placeholder")}
            placeholderTextColor={MutedColor}
            multiline
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnOff,
            ]}
            onPress={send}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel={t("messages_send")}
          >
            <Ionicons name="send" size={26} color={AppColors.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.cream },
  loader: { marginTop: Spacing.xxxl },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: MutedColor,
    textAlign: "center",
    paddingHorizontal: Spacing.xxl,
  },
  list: { padding: Spacing.lg, gap: Spacing.md },
  row: { flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: AppColors.dark,
    borderColor: AppColors.dark,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: AppColors.white,
    borderColor: BorderColor,
    borderBottomLeftRadius: 4,
  },
  author: {
    fontSize: FontSizes.sm,
    fontWeight: "800",
    color: MutedColor,
    marginBottom: Spacing.xs,
  },
  body: { fontSize: FontSizes.lg, color: AppColors.text, lineHeight: 26 },
  bodyMine: { color: AppColors.white },
  listen: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.cream,
  },
  listenText: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: AppColors.dark,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: BorderColor,
    backgroundColor: AppColors.white,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    fontSize: FontSizes.lg,
    color: AppColors.text,
    backgroundColor: AppColors.cream,
    borderWidth: 1,
    borderColor: BorderColor,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sendBtn: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.4 },
});
