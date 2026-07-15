import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:ofacilite/core/services/tts_service.dart';
import 'package:ofacilite/core/theme/app_theme.dart';
import 'package:ofacilite/shared/widgets/accessible_button.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

class _Place {
  final String name;
  final String category;
  final String address;
  final String phone;
  final double latitude;
  final double longitude;

  const _Place({
    required this.name,
    required this.category,
    required this.address,
    required this.phone,
    required this.latitude,
    required this.longitude,
  });

  factory _Place.fromJson(Map<String, dynamic> json) => _Place(
        name: json['name'] as String,
        category: json['category'] as String,
        address: json['address'] as String,
        phone: json['phone'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
      );
}

Color _categoryColor(String category) => switch (category) {
      "O'Survie" => const Color(0xFF1565C0),
      'CCAS' => const Color(0xFFF57C00),
      'Mairie' => const Color(0xFFD32F2F),
      'Banque alimentaire' => const Color(0xFF388E3C),
      'Numérique' => const Color(0xFF7B1FA2),
      _ => Colors.grey,
    };

IconData _categoryIcon(String category) => switch (category) {
      "O'Survie" => Icons.volunteer_activism_rounded,
      'CCAS' => Icons.people_rounded,
      'Mairie' => Icons.account_balance_rounded,
      'Banque alimentaire' => Icons.lunch_dining_rounded,
      'Numérique' => Icons.computer_rounded,
      _ => Icons.place_rounded,
    };

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  FlutterTts get _tts => TtsService.instance.tts;
  final MapController _mapController = MapController();
  bool _ttsInitialized = false;
  List<_Place> _places = [];
  LatLng? _userPosition;

  static const _bondy = LatLng(48.9031, 2.4831);

  @override
  void initState() {
    super.initState();
    _loadPlaces();
    _fetchLocation();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_ttsInitialized) {
      _ttsInitialized = true;
      _initTts();
    }
  }

  Future<void> _initTts() async {
    await TtsService.instance.init(context.locale.languageCode);
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) await _tts.speak('map_tts_intro'.tr());
  }

  Future<void> _loadPlaces() async {
    final raw = await rootBundle.loadString('assets/data/places.json');
    final list = jsonDecode(raw) as List<dynamic>;
    if (mounted) {
      setState(() {
        _places = list
            .map((e) => _Place.fromJson(e as Map<String, dynamic>))
            .toList();
      });
    }
  }

  Future<void> _fetchLocation() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      if (!mounted) return;
      final userLatLng = LatLng(position.latitude, position.longitude);
      setState(() => _userPosition = userLatLng);
      _mapController.move(userLatLng, 14);
    } catch (_) {
      // Permission refusée ou GPS indisponible : on reste sur Bondy
    }
  }

  void _showPlaceSheet(_Place place) {
    _tts.stop();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _PlaceSheet(place: place),
    );
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('map_title'.tr()),
        backgroundColor: AppColors.dark,
        foregroundColor: AppColors.white,
      ),
      body: _places.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              mapController: _mapController,
              options: const MapOptions(
                initialCenter: _bondy,
                initialZoom: 14,
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.osurvie.ofacilite',
                ),
                MarkerLayer(
                  markers: _places.map((place) {
                    return Marker(
                      point: LatLng(place.latitude, place.longitude),
                      width: 48,
                      height: 48,
                      child: GestureDetector(
                        onTap: () => _showPlaceSheet(place),
                        onLongPress: () => TtsService.instance.speak(
                          '${place.name}. ${place.address}.',
                        ),
                        child: Icon(
                          Icons.location_pin,
                          color: _categoryColor(place.category),
                          size: 48,
                        ),
                      ),
                    );
                  }).toList(),
                ),
                if (_userPosition != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _userPosition!,
                        width: 22,
                        height: 22,
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.dark,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black26,
                                blurRadius: 6,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
    );
  }
}

class _PlaceSheet extends StatelessWidget {
  const _PlaceSheet({required this.place});
  final _Place place;

  @override
  Widget build(BuildContext context) {
    final color = _categoryColor(place.category);
    final icon = _categoryIcon(place.category);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: color,
                  child: Icon(icon, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        place.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          place.category,
                          style: TextStyle(
                            fontSize: 13,
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.place_rounded, color: Color(0xFF888888)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    place.address,
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.phone_rounded, color: Color(0xFF888888)),
                const SizedBox(width: 10),
                Text(place.phone, style: const TextStyle(fontSize: 16)),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.phone_rounded, size: 28),
                label: Text(
                  'map_call'.tr(),
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.dark,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () async {
                  final uri = Uri(scheme: 'tel', path: place.phone);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  }
                },
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: AccessibleButton(
                description: 'map_desc_directions'
                    .tr(namedArgs: {'name': place.name}),
                onTap: () async {
                  final uri = Uri.parse(
                    'https://maps.google.com/maps?daddr=${place.latitude},${place.longitude}',
                  );
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                },
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.directions_rounded, size: 28),
                  label: Text(
                    'map_directions'.tr(),
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.dark,
                    disabledBackgroundColor: AppColors.primary,
                    disabledForegroundColor: AppColors.dark,
                    minimumSize: const Size(double.infinity, 0),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: null,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
