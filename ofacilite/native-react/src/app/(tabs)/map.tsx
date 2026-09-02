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
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AccessibleButton from "@/components/accessible-button";
import VoiceInput from "@/components/voice-input";
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
  image?: string;
}

/** minuscules, sans accents, garde tous les alphabets. */
function normPlace(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Mots-clés par catégorie (fr + ar + bn + ta) pour « dites : mairie, aide sociale… ».
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Mairie: ["mairie", "town hall", "hotel de ville", "بلدية", "البلدية", "நகராட்சி", "টাউন হল", "পৌরসভা"],
  CCAS: [
    "ccas", "centre communal", "aide sociale", "action sociale",
    "assistante sociale", "الشؤون الاجتماعية", "المساعدة الاجتماعية",
    "சமூக சேவை", "সামাজিক পরিষেবা",
  ],
  "Banque alimentaire": [
    "banque alimentaire", "food bank", "nourriture", "manger", "colis",
    "alimentaire", "بنك الطعام", "طعام", "খাবার", "ফুড ব্যাংক", "உணவு வங்கி",
  ],
  Numérique: [
    "numerique", "ordinateur", "internet", "informatique", "computer",
    "digital", "الرقمي", "كمبيوتر", "انترنت", "கணினி", "இணையம்", "কম্পিউটার",
  ],
  "O'Survie": [
    "o survie", "osurvie", "survie", "permanence", "association",
    "الجمعية", "أوسورفي", "அமைப்பு", "সংস্থা",
  ],
};

/** Retrouve le lieu qui colle le mieux à ce qui a été dit (nom ou catégorie). */
function findPlaceByVoice(spoken: string, places: Place[]): Place | null {
  const q = normPlace(spoken);
  if (!q) return null;
  const qTokens = q.split(" ").filter(Boolean);

  let best: { p: Place; score: number } | null = null;
  for (const p of places) {
    const name = normPlace(p.name);
    let score = 0;
    if (name === q) score = 100;
    else if (name.includes(q) || q.includes(name)) score = 70;
    else {
      const nameTokens = new Set(name.split(" "));
      score =
        qTokens.filter((w) => w.length > 2 && nameTokens.has(w)).length * 20;
    }
    const kws = CATEGORY_KEYWORDS[p.category] ?? [];
    if (kws.some((kw) => q.includes(normPlace(kw)))) {
      score = Math.max(score, 55);
    }
    if (score > 0 && (!best || score > best.score)) best = { p, score };
  }
  return best && best.score >= 20 ? best.p : null;
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
  const insets = useSafeAreaInsets();

  const [places] = useState<Place[]>(placesData as Place[]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);

  useAutoTTS("map_tts_intro");

  const showPlaceSheet = (place: Place) => {
    TtsService.instance.stop();
    setSelectedPlace(place);
  };

  const openWalkingDirections = (place: Place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=walking`;
    Linking.openURL(url);
  };

  // « Dites où aller » -> trouve le lieu et lance le GPS à pied directement.
  const handleVoicePlace = async (transcript: string) => {
    setShowVoiceDialog(false);
    const place = findPlaceByVoice(transcript, places);
    await TtsService.instance.stop();
    if (place) {
      await TtsService.instance.speak(t("map_guiding", { name: place.name }));
      openWalkingDirections(place);
    } else {
      await TtsService.instance.speak(t("map_place_not_found"));
    }
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
      zoomControl: false,
      attributionControl: true,
    }).setView([BONDY.latitude, BONDY.longitude], 15);

    // Zoom en bas à gauche : le bandeau "Dire où aller" occupe le haut.
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

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
            '<div class="marker-pin" style="' +
              (place.image
                ? 'background-image: url(' + place.image + '); background-size: cover; background-position: center;'
                : 'background-color:' + categoryColor(place.category) + ';'
              ) +
            '">' + (place.image ? '' : categoryEmoji(place.category)) + '</div>' +
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

      {/* Dire un lieu -> GPS à pied direct */}
      <Pressable
        style={styles.voiceBar}
        onPress={() => {
          TtsService.instance.stop();
          setShowVoiceDialog(true);
        }}
        onLongPress={() =>
          TtsService.instance.speak(t("map_desc_say_place"))
        }
      >
        <Ionicons name="mic" size={24} color={AppColors.white} />
        <Text style={styles.voiceBarText}>{t("map_say_place")}</Text>
      </Pressable>

      {/* Voice place dialog */}
      <Modal visible={showVoiceDialog} transparent animationType="fade">
        <View style={styles.voiceBackdrop}>
          <View style={styles.voiceCard}>
            <Text style={styles.voiceTitle}>{t("map_say_place")}</Text>
            <Text style={styles.voicePrompt}>{t("map_say_place_prompt")}</Text>
            <VoiceInput lang={i18n.language} onResult={handleVoicePlace} />
            <Pressable
              style={styles.voiceCancel}
              onPress={() => setShowVoiceDialog(false)}
            >
              <Text style={styles.voiceCancelText}>{t("health_cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + Spacing.xl, Spacing.xxxl) }]} onPress={(e) => e.stopPropagation()}>
            {selectedPlace && (
              <>
                {selectedPlace.image && (
                  <Image
                    source={{ uri: selectedPlace.image }}
                    style={styles.placeImageModal}
                    resizeMode="cover"
                  />
                )}
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
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}&travelmode=walking`;
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
          </Pressable>
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
  voiceBar: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.dark,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: AppColors.white,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceBarText: {
    fontSize: FontSizes.lg,
    fontWeight: "800",
    color: AppColors.white,
  },
  voiceBackdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(6,16,30,0.55)",
    padding: Spacing.xl,
  },
  voiceCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  voiceTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: AppColors.text,
  },
  voicePrompt: {
    fontSize: FontSizes.md,
    color: AppColors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  voiceCancel: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  voiceCancelText: {
    fontSize: FontSizes.md,
    color: AppColors.dark,
    fontWeight: "700",
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
  placeImageModal: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
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
