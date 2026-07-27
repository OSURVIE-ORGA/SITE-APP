import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import TtsService from "@/services/tts-service";

export default function MedicationCheckScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();

  useEffect(() => {
    // Play voice prompt
    TtsService.instance.speak(`Il est l'heure de prendre votre médicament : ${name || "votre traitement"}. L'avez-vous pris ?`);
  }, [name]);

  return (
    <View style={styles.container}>
      <Ionicons name="medical" size={100} color={AppColors.white} style={styles.icon} />
      
      <Text style={styles.title}>L'heure du médicament !</Text>
      
      <View style={styles.medContainer}>
        <Text style={styles.medName}>{name || "Votre traitement"}</Text>
      </View>
      
      <Text style={styles.question}>Avez-vous pris votre médicament ?</Text>
      
      <View style={styles.actions}>
        <Pressable 
          style={[styles.button, styles.btnYes]} 
          onPress={() => {
            TtsService.instance.stop();
            router.back();
          }}
        >
          <Ionicons name="checkmark-circle" size={32} color={AppColors.white} />
          <Text style={styles.btnText}>Oui, j'ai pris</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.button, styles.btnNo]} 
          onPress={() => {
            TtsService.instance.stop();
            router.back();
          }}
        >
          <Ionicons name="close-circle" size={32} color={AppColors.red} />
          <Text style={[styles.btnText, styles.btnTextNo]}>Non, pas encore</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  icon: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: AppColors.white,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  medContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    width: "100%",
  },
  medName: {
    fontSize: 28,
    fontWeight: "bold",
    color: AppColors.white,
    textAlign: "center",
  },
  question: {
    fontSize: 24,
    color: AppColors.white,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    opacity: 0.9,
  },
  actions: {
    width: "100%",
    gap: Spacing.lg,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnYes: {
    backgroundColor: "#2E7D32", // Green
  },
  btnNo: {
    backgroundColor: AppColors.white,
  },
  btnText: {
    fontSize: 22,
    fontWeight: "bold",
    color: AppColors.white,
  },
  btnTextNo: {
    color: AppColors.red,
  }
});
