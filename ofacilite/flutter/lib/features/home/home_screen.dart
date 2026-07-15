import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:ofacilite/core/services/notification_service.dart';
import 'package:ofacilite/core/services/tts_service.dart';
import 'package:ofacilite/core/theme/app_theme.dart';
import 'package:ofacilite/main.dart';
import 'package:ofacilite/features/contacts/contacts_screen.dart';
import 'package:ofacilite/features/document/document_screen.dart';
import 'package:ofacilite/features/health/health_screen.dart';
import 'package:ofacilite/features/help/help_screen.dart';
import 'package:ofacilite/features/map/map_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with RouteAware {
  FlutterTts get _tts => TtsService.instance.tts;

  bool _ttsInitialized = false;
  bool _isDiscovering = false;
  bool _discoveryCancelled = false;
  int? _highlightedButton; // 0=Document 1=Contacts 2=Santé 3=Carte

  static const _discoveryKeys = [
    'home_desc_document',
    'home_desc_contacts',
    'home_desc_health',
    'home_desc_map',
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_ttsInitialized) {
      _ttsInitialized = true;
      _initTts();
    }
    routeObserver.subscribe(this, ModalRoute.of(context)!);
  }

  Future<void> _initTts() async {
    await TtsService.instance.init(context.locale.languageCode);

    // Cas cold-start : l'app a été ouverte depuis une notification fermée.
    final payload = NotificationService.launchPayload;
    if (payload != null) {
      NotificationService.launchPayload = null; // consommé une seule fois
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;

      final type = payload['type'] as String? ?? '';
      final extra = type == 'medication'
          ? (payload['name'] as String? ?? '')
          : (payload['body'] as String? ?? '');
      final tab = type == 'medication' ? 0 : 1;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => HealthScreen(initialTab: tab, suppressInitTts: true),
        ),
      );

      await Future.delayed(const Duration(milliseconds: 300));
      final text = type == 'medication'
          ? 'notif_med_tts'.tr(namedArgs: {'name': extra})
          : 'notif_appt_tts'.tr(namedArgs: {'body': extra});
      await TtsService.instance.speak(text);
      return;
    }

    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) await _tts.speak('home_question'.tr());
  }

  @override
  void didPopNext() async {
    _discoveryCancelled = true;
    if (mounted) setState(() { _isDiscovering = false; _highlightedButton = null; });
    await _tts.stop();
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) await _tts.speak('home_question'.tr());
  }

  @override
  void dispose() {
    routeObserver.unsubscribe(this);
    _tts.stop();
    super.dispose();
  }

  Future<void> _navigateTo(Widget screen) async {
    _discoveryCancelled = true;
    await _tts.stop();
    if (!mounted) return;
    setState(() { _isDiscovering = false; _highlightedButton = null; });
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  // Attend la fin de l'énoncé TTS via completion/cancel handler.
  Future<void> _speakAndWait(String text) async {
    final completer = Completer<void>();
    
    _tts.setCompletionHandler(() {
      if (!completer.isCompleted) completer.complete();
    });
    _tts.setCancelHandler(() {
      if (!completer.isCompleted) completer.complete();
    });
    _tts.setErrorHandler((msg) {
      if (!completer.isCompleted) completer.complete();
    });
    
    await _tts.speak(text);
    
    // Timeout de sécurité : 15 secondes max par bouton
    await completer.future.timeout(
      const Duration(seconds: 15),
      onTimeout: () {},
    );
  }

  // Lance la visite guidée avec highlight glissant et pauses de 2s.
  Future<void> _startDiscovery() async {
    if (_isDiscovering) return;
    await _tts.stop();
    if (!mounted) return;
    setState(() {
      _isDiscovering = true;
      _discoveryCancelled = false;
      _highlightedButton = null;
    });

    for (int i = 0; i < _discoveryKeys.length; i++) {
      if (_discoveryCancelled || !mounted) break;
      setState(() => _highlightedButton = i);
      await _speakAndWait(_discoveryKeys[i].tr());
      if (_discoveryCancelled || !mounted) break;
      setState(() => _highlightedButton = null);
      await Future.delayed(const Duration(seconds: 2));
    }

    TtsService.instance.resetHandlers();
    if (mounted) setState(() { _isDiscovering = false; _highlightedButton = null; });
  }

  // Stoppe la visite guidée : TTS arrêté + highlight effacé immédiatement.
  Future<void> _stopDiscovery() async {
    _discoveryCancelled = true;
    await _tts.stop();
    if (mounted) setState(() { _isDiscovering = false; _highlightedButton = null; });
  }

  // Long press : highlight + lecture de la description du bouton pressé.
  Future<void> _speakButton(int index, String key) async {
    _discoveryCancelled = true;
    await _tts.stop();
    // Cède un tour d'event loop pour laisser le cleanup de la visite s'exécuter.
    await Future.delayed(Duration.zero);
    if (!mounted) return;
    setState(() { _isDiscovering = false; _highlightedButton = index; });
    await _speakAndWait(key.tr());
    TtsService.instance.resetHandlers();
    if (mounted) setState(() => _highlightedButton = null);
  }

  Future<void> _showLanguagePicker() async {
    _discoveryCancelled = true;
    await _tts.stop();
    if (!mounted) return;
    setState(() { _isDiscovering = false; _highlightedButton = null; });
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _LanguageSheet(
        onLocaleSelected: (locale) async {
          Navigator.pop(context);
          await context.setLocale(locale);
          await TtsService.instance.init(locale.languageCode);
          await Future.delayed(const Duration(milliseconds: 400));
          if (mounted) await _tts.speak('home_question'.tr());
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 4, 12),
              child: Row(
                children: [
                  const Spacer(),
                  Text(
                    'home_title'.tr(),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const Spacer(),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: _isDiscovering
                        ? IconButton(
                            key: const ValueKey('stop'),
                            icon: const Icon(
                              Icons.stop_circle_rounded,
                              size: 32,
                              color: Color(0xFFD32F2F),
                            ),
                            onPressed: _stopDiscovery,
                          )
                        : IconButton(
                            key: const ValueKey('discover'),
                            color: AppColors.dark,
                            icon: const Icon(
                              Icons.record_voice_over_rounded,
                              size: 32,
                              color: AppColors.dark,
                            ),
                            onPressed: _startDiscovery,
                          ),
                  ),
                  IconButton(
                    color: AppColors.dark,
                    icon: const Icon(
                      Icons.volunteer_activism_rounded,
                      size: 32,
                      color: AppColors.dark,
                    ),
                    onPressed: () => _navigateTo(const HelpScreen()),
                  ),
                  IconButton(
                    color: AppColors.dark,
                    icon: const Icon(
                      Icons.language,
                      size: 32,
                      color: AppColors.dark,
                    ),
                    onPressed: _showLanguagePicker,
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Column(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(
                            child: _BigButton(
                              icon: Icons.description_rounded,
                              label: 'home_document'.tr(),
                              color: AppColors.dark,
                              isHighlighted: _highlightedButton == 0,
                              onTap: () => _navigateTo(const DocumentScreen()),
                              onLongPress: () => _speakButton(0, 'home_desc_document'),
                            ),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: _BigButton(
                              icon: Icons.contacts_rounded,
                              label: 'home_contacts'.tr(),
                              color: AppColors.dark,
                              isHighlighted: _highlightedButton == 1,
                              onTap: () => _navigateTo(const ContactsScreen()),
                              onLongPress: () => _speakButton(1, 'home_desc_contacts'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(
                            child: _BigButton(
                              icon: Icons.favorite_rounded,
                              label: 'home_health'.tr(),
                              color: AppColors.dark,
                              isHighlighted: _highlightedButton == 2,
                              onTap: () => _navigateTo(const HealthScreen()),
                              onLongPress: () => _speakButton(2, 'home_desc_health'),
                            ),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: _BigButton(
                              icon: Icons.map_rounded,
                              label: 'home_map'.tr(),
                              color: AppColors.dark,
                              isHighlighted: _highlightedButton == 3,
                              onTap: () => _navigateTo(const MapScreen()),
                              onLongPress: () => _speakButton(3, 'home_desc_map'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BigButton extends StatelessWidget {
  const _BigButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.onLongPress,
    this.isHighlighted = false,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 72, color: Colors.white),
                  const SizedBox(height: 16),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              AnimatedOpacity(
                opacity: isHighlighted ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 200),
                child: ColoredBox(
                  color: Colors.black.withValues(alpha: 0.30),
                  child: const Center(
                    child: Icon(
                      Icons.volume_up_rounded,
                      color: Colors.white,
                      size: 56,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageSheet extends StatelessWidget {
  const _LanguageSheet({required this.onLocaleSelected});

  final void Function(Locale) onLocaleSelected;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _tile(context, '🇫🇷', 'Français', const Locale('fr')),
            _tile(context, '🇬🇧', 'English', const Locale('en')),
            _tile(context, '🇸🇦', 'عربي', const Locale('ar')),
          ],
        ),
      ),
    );
  }

  Widget _tile(BuildContext context, String flag, String label, Locale locale) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Text(flag, style: const TextStyle(fontSize: 36)),
      title: Text(
        label,
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
      ),
      onTap: () => onLocaleSelected(locale),
    );
  }
}
