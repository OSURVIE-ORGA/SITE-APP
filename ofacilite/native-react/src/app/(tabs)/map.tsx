import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import AccessibleButton from "@/components/accessible-button";
import { AppColors, BorderRadius, FontSizes, Spacing } from "@/constants/theme";
import placesData from "@/data/places.json";
import TtsService from "@/services/tts-service";
import { useAutoTTS } from "@/hooks/useAutoTTS";

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

function categoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case "O'Survie":
      return "hand-left";
    case "CCAS":
      return "people";
    case "Mairie":
      return "business";
    case "Banque alimentaire":
      return "fast-food";
    case "Numérique":
      return "desktop";
    default:
      return "location";
  }
}

const BONDY = { latitude: 48.9031, longitude: 2.4831 };

export default function MapScreen() {
  const { t, i18n } = useTranslation();

  const [places] = useState<Place[]>(placesData as Place[]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useAutoTTS("map_tts_intro");

  const showPlaceSheet = (place: Place) => {
    TtsService.instance.stop();
    setSelectedPlace(place);
  };

  const mapHtml = useMemo(() => {
    const placesJson = JSON.stringify(places);
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      margin: 0;
      width: 100%;
      height: 100%;
      background: #f0e8c8;
    }
    .leaflet-container {
      font-family: Arial, sans-serif;
    }
    .marker-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .marker-label {
      max-width: 140px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.96);
      color: #3d2b1f;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
    .marker-pin {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 16px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const BONDY = ${JSON.stringify(BONDY)};
    const places = ${placesJson};

    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([BONDY.latitude, BONDY.longitude], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    function categoryColor(category) {
      switch (category) {
        case "O'Survie": return '#1565C0';
        case 'CCAS': return '#F57C00';
        case 'Mairie': return '#D32F2F';
        case 'Banque alimentaire': return '#388E3C';
        case 'Numérique': return '#7B1FA2';
        default: return '#888888';
      }
    }

    function categoryEmoji(category) {
      switch (category) {
        case "O'Survie": return '🤝';
        case 'CCAS': return '👥';
        case 'Mairie': return '🏛️';
        case 'Banque alimentaire': return '🍎';
        case 'Numérique': return '💻';
        default: return '📍';
      }
    }

    places.forEach((place, index) => {
      const marker = L.marker([place.latitude, place.longitude], {
        icon: L.divIcon({
          className: '',
          html: '<div class="marker-wrap">' +
            '<div class="marker-label">' + place.name + '</div>' +
            '<div class="marker-pin" style="background:' + categoryColor(place.category) + '">' + categoryEmoji(place.category) + '</div>' +
          '</div>',
          iconSize: [140, 76],
          iconAnchor: [70, 76],
        }),
      }).addTo(map);

      marker.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'place',
          index,
        }));
      });
    });
  </script>
</body>
</html>`;
  }, [places]);

  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              index?: number;
            };

            if (payload.type === "place" && typeof payload.index === "number") {
              const place = places[payload.index];
              if (place) {
                showPlaceSheet(place);
              }
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />

      {/* Place detail sheet */}
      <Modal
        visible={!!selectedPlace}
        transparent
        animationType="slide"
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
                      name={categoryIcon(selectedPlace.category)}
                      size={28}
                      color={AppColors.white}
                    />
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{selectedPlace.name}</Text>
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor:
                            categoryColor(selectedPlace.category) + "26",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: categoryColor(selectedPlace.category) },
                        ]}
                      >
                        {selectedPlace.category}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color="#888888" />
                  <Text style={styles.detailText}>{selectedPlace.address}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="call" size={20} color="#888888" />
                  <Text style={styles.detailText}>{selectedPlace.phone}</Text>
                </View>

                <Pressable
                  style={styles.callFullButton}
                  onPress={() => Linking.openURL(`tel:${selectedPlace.phone}`)}
                >
                  <Ionicons name="call" size={24} color={AppColors.white} />
                  <Text style={styles.callFullButtonText}>{t("map_call")}</Text>
                </Pressable>

                <AccessibleButton
                  description={t("map_desc_directions", {
                    name: selectedPlace.name,
                  })}
                  onTap={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`;
                    Linking.openURL(url);
                  }}
                >
                  <View style={styles.directionsButton}>
                    <Ionicons
                      name="navigate"
                      size={24}
                      color={AppColors.dark}
                    />
                    <Text style={styles.directionsButtonText}>
                      {t("map_directions")}
                    </Text>
                  </View>
                </AccessibleButton>
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
  },
  map: {
    width: "100%",
    height: "100%",
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  placeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  placeInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  placeName: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: AppColors.text,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailText: {
    fontSize: FontSizes.md,
    color: AppColors.text,
    flex: 1,
  },
  callFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.dark,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  callFullButtonText: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: AppColors.white,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  directionsButtonText: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: AppColors.dark,
  },
});
