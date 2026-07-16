import { AppColors, BorderRadius, FontSizes } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface BigButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  isHighlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

/**
 * Gros bouton de la Home — équivalent Flutter _BigButton.
 * Fond coloré, icône 72px, label en blanc, ombre, highlight avec overlay.
 */
export default function BigButton({
  icon,
  label,
  color,
  isHighlighted = false,
  onPress,
  onLongPress,
}: BigButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: color },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.glow} />
      <View style={styles.topStripe} />
      <View style={styles.content}>
        <Ionicons name={icon} size={FontSizes.icon} color={AppColors.white} />
        <Text style={styles.label}>{label}</Text>
      </View>

      {isHighlighted && (
        <View style={styles.highlightOverlay}>
          <Ionicons name="volume-high" size={56} color={AppColors.white} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.xxl,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#06101E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },
  glow: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  topStripe: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  label: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: AppColors.white,
    letterSpacing: 0.2,
  },
  highlightOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.30)",
    justifyContent: "center",
    alignItems: "center",
  },
});
