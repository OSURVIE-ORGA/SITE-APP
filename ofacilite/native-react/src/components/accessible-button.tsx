import { BorderRadius } from "@/constants/theme";
import TtsService from "@/services/tts-service";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
    Pressable,
    Animated as RNAnimated,
    StyleSheet,
    View,
} from "react-native";

interface AccessibleButtonProps {
  description: string;
  onTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
}

/**
 * Bouton accessible avec TTS au long press — équivalent Flutter AccessibleButton.
 * Au long press : scale 0.95, overlay noir + icône volume, puis retour à la normale.
 */
export default function AccessibleButton({
  description,
  onTap,
  onLongPress,
  children,
}: AccessibleButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scaleAnim = React.useRef(new RNAnimated.Value(1)).current;

  const handleLongPress = useCallback(async () => {
    setIsSpeaking(true);
    RNAnimated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    try {
      await TtsService.instance.speak(description);
    } finally {
      setIsSpeaking(false);
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }

    onLongPress?.();
  }, [description, onLongPress, scaleAnim]);

  return (
    <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={onTap} onLongPress={handleLongPress}>
        <View>
          {children}
          {isSpeaking && (
            <View style={styles.overlay}>
              <Ionicons name="volume-high" size={40} color="#FFFFFF" />
            </View>
          )}
        </View>
      </Pressable>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.30)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
  },
});
