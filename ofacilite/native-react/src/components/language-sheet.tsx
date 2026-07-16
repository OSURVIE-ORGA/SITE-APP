import { AppColors, BorderRadius, BorderColor, FontSizes, Spacing } from "@/constants/theme";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface LanguageSheetProps {
  visible: boolean;
  onSelect: (code: string) => void;
  onClose: () => void;
}

/**
 * Bottom sheet pour le choix de langue — équivalent Flutter _LanguageSheet.
 */
export default function LanguageSheet({
  visible,
  onSelect,
  onClose,
}: LanguageSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              style={({ pressed }) => [
                styles.tile,
                pressed && styles.tilePressed,
              ]}
              onPress={() => onSelect(lang.code)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={styles.label}>{lang.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(6,16,30,0.46)",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: BorderColor,
    marginBottom: Spacing.md,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: 4,
    borderRadius: BorderRadius.lg,
  },
  tilePressed: {
    backgroundColor: "#EADEC9",
  },
  flag: {
    fontSize: 36,
  },
  label: {
    fontSize: FontSizes.xxl,
    fontWeight: "600",
    color: AppColors.text,
  },
});
