import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import TtsService from "@/services/tts-service";

interface DocumentScannerCameraProps {
  visible: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
}

/**
 * Écran caméra plein écran avec un cadre de cadrage, pour aider la personne
 * à bien positionner une lettre ou une ordonnance avant de prendre la photo.
 * Équivalent accessible d'un "scanner de document".
 */
export default function DocumentScannerCamera({
  visible,
  onCapture,
  onClose,
}: DocumentScannerCameraProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    TtsService.instance.init(i18n.language);
    const timer = setTimeout(() => {
      TtsService.instance.speak(t("document_scanner_tts_intro"));
    }, 500);
    return () => {
      clearTimeout(timer);
      TtsService.instance.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const frameWidth = width * 0.82;
  const frameHeight = Math.min(frameWidth * 1.3, height * 0.6);
  const frameLeft = (width - frameWidth) / 2;
  const frameTop = height * 0.2;

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        await TtsService.instance.stop();
        onCapture(photo.uri);
      }
    } catch {
      // La personne peut simplement réessayer.
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    TtsService.instance.stop();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.permissionContainer} />
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={AppColors.white} />
            <Text style={styles.permissionText}>
              {t("document_scanner_permission_text")}
            </Text>
            <AccessibleButton
              description={t("document_scanner_desc_allow")}
              onTap={requestPermission}
            >
              <View style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>
                  {t("document_scanner_allow")}
                </Text>
              </View>
            </AccessibleButton>
            <AccessibleButton
              description={t("document_scanner_desc_back")}
              onTap={handleClose}
            >
              <View style={styles.permissionCancelButton}>
                <Text style={styles.permissionCancelText}>
                  {t("document_scanner_back")}
                </Text>
              </View>
            </AccessibleButton>
          </View>
        ) : (
          <>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

            <View style={[styles.mask, { top: 0, left: 0, right: 0, height: frameTop }]} />
            <View
              style={[
                styles.mask,
                { top: frameTop + frameHeight, left: 0, right: 0, bottom: 0 },
              ]}
            />
            <View
              style={[
                styles.mask,
                { top: frameTop, height: frameHeight, left: 0, width: frameLeft },
              ]}
            />
            <View
              style={[
                styles.mask,
                {
                  top: frameTop,
                  height: frameHeight,
                  left: frameLeft + frameWidth,
                  right: 0,
                },
              ]}
            />

            <View
              pointerEvents="none"
              style={[
                styles.frame,
                { top: frameTop, left: frameLeft, width: frameWidth, height: frameHeight },
              ]}
            >
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>

            <View
              pointerEvents="none"
              style={[styles.instructionRow, { top: insets.top + Spacing.md + 64 }]}
            >
              <Text style={styles.instructionText}>
                {t("document_scanner_instruction")}
              </Text>
            </View>

            <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
              <AccessibleButton
                description={t("document_scanner_desc_back")}
                onTap={handleClose}
              >
                <View style={styles.closeButton}>
                  <Ionicons name="arrow-back" size={26} color={AppColors.white} />
                </View>
              </AccessibleButton>
            </View>

            <View
              style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}
            >
              <AccessibleButton
                description={t("document_scanner_desc_capture")}
                onTap={handleCapture}
              >
                <View style={styles.captureOuter}>
                  <View style={styles.captureInner} />
                </View>
              </AccessibleButton>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mask: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: BorderRadius.md,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: AppColors.primary,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: BorderRadius.md,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: BorderRadius.md,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: BorderRadius.md,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: BorderRadius.md,
  },
  topBar: {
    position: "absolute",
    left: Spacing.lg,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionRow: {
    position: "absolute",
    left: Spacing.xxl,
    right: Spacing.xxl,
    alignItems: "center",
  },
  instructionText: {
    color: AppColors.white,
    fontSize: FontSizes.lg,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: AppColors.white,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: AppColors.dark,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxxl,
    gap: Spacing.xl,
  },
  permissionText: {
    color: AppColors.white,
    fontSize: FontSizes.lg,
    textAlign: "center",
    lineHeight: 26,
  },
  permissionButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    minWidth: 220,
    alignItems: "center",
  },
  permissionButtonText: {
    color: AppColors.dark,
    fontSize: FontSizes.lg,
    fontWeight: "bold",
  },
  permissionCancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  permissionCancelText: {
    color: AppColors.white,
    fontSize: FontSizes.md,
    opacity: 0.85,
  },
});
