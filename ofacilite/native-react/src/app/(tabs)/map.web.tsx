import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import placesData from "@/data/places.json";
import TtsService from "@/services/tts-service";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Place {
  name: string;
  category: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

function categoryColor(category: string): string {
  switch (category) {
    case "O'Survie":
      return "#1565C0";
    case "CCAS":
      return "#F57C00";
    case "Mairie":
      return "#D32F2F";
    case "Banque alimentaire":
      return "#388E3C";
    case "Numérique":
      return "#7B1FA2";
    default:
      return "#888888";
  }
}

const BONDY = { latitude: 48.9031, longitude: 2.4831 };

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const places = placesData as Place[];
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    TtsService.instance.init(i18n.language);
    const timer = setTimeout(() => {
      TtsService.instance.speak(t("map_tts_intro"));
    }, 800);
    return () => {
      clearTimeout(timer);
      TtsService.instance.stop();
    };
  }, []);

  useEffect(() => {
    if (
      !mapRef.current ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    let isMounted = true;

    const setupMap = async () => {
      const leafletModule = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapRef.current) return;

      const L = leafletModule.default;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([BONDY.latitude, BONDY.longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      markersRef.current = places.map((place) => {
        const markerHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);pointer-events:auto;">
            <div style="width:34px;height:34px;border-radius:999px;background:${categoryColor(place.category)};border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.22);">
              <span style="color:#fff;font-weight:900;font-size:16px;line-height:1;">•</span>
            </div>
            <div style="margin-top:4px;max-width:110px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.95);color:${AppColors.text};font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
              ${place.name}
            </div>
          </div>`;

        const marker = L.marker([place.latitude, place.longitude], {
          icon: L.divIcon({
            className: "",
            html: markerHtml,
            iconSize: [120, 60],
            iconAnchor: [60, 48],
          }),
          riseOnHover: true,
        }).addTo(map);

        marker.on("click", () => {
          setSelectedPlace(place);
          marker
            .bindPopup(
              `<div style="font-family:Arial,sans-serif;max-width:220px;padding:2px 0;">
              <div style="font-weight:700;font-size:14px;color:#3D2B1F;margin-bottom:4px;">${place.name}</div>
              <div style="font-size:12px;color:#555;margin-bottom:4px;">${place.address}</div>
              <div style="font-size:12px;color:#555;">${place.phone}</div>
            </div>`,
            )
            .openPopup();
        });

        return marker;
      });
    };

    setupMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapInstanceRef.current?.remove?.();
      mapInstanceRef.current = null;
    };
  }, [places]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("map_title")}</Text>
      <Text style={styles.subtitle}>
        Carte gratuite avec OpenStreetMap. Les balises restent attachées à leur
        adresse quand tu zoomes ou déplaces la carte.
      </Text>

      <View style={styles.mapCard}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </View>

      <Modal
        visible={!!selectedPlace}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setSelectedPlace(null)}
        >
          <View style={styles.sheet}>
            {selectedPlace && (
              <>
                <View style={styles.sheetHeader}>
                  <View
                    style={[
                      styles.placeAvatar,
                      {
                        backgroundColor: categoryColor(selectedPlace.category),
                      },
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={26}
                      color={AppColors.white}
                    />
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{selectedPlace.name}</Text>
                    <Text style={styles.placeMeta}>
                      {selectedPlace.category}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailText}>{selectedPlace.address}</Text>
                <Text style={styles.detailText}>{selectedPlace.phone}</Text>

                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.callButton}
                    onPress={() =>
                      Linking.openURL(`tel:${selectedPlace.phone}`)
                    }
                  >
                    <Ionicons name="call" size={18} color={AppColors.white} />
                    <Text style={styles.callButtonText}>Appeler</Text>
                  </Pressable>

                  <Pressable
                    style={styles.directionsButton}
                    onPress={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Ionicons
                      name="navigate"
                      size={18}
                      color={AppColors.dark}
                    />
                    <Text style={styles.directionsButtonText}>Itinéraire</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.cream,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: "bold",
    color: AppColors.dark,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: AppColors.text,
    lineHeight: 22,
  },
  mapCard: {
    position: "relative",
    height: 320,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: "#E0D4B1",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  placeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: FontSizes.lg,
    fontWeight: "800",
    color: AppColors.text,
  },
  placeMeta: {
    fontSize: FontSizes.sm,
    color: "#666666",
  },
  detailText: {
    fontSize: FontSizes.md,
    color: AppColors.text,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: AppColors.dark,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  callButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: AppColors.white,
  },
  directionsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  directionsButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: AppColors.dark,
  },
});
