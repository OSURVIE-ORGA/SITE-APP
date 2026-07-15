import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:ofacilite/core/app_navigator.dart';
import 'package:ofacilite/core/services/notification_service.dart';
import 'package:ofacilite/core/services/tts_service.dart';
import 'package:ofacilite/features/health/health_screen.dart';
import 'package:ofacilite/core/theme/app_theme.dart';
import 'package:ofacilite/features/home/home_screen.dart';

final RouteObserver<ModalRoute<void>> routeObserver =
    RouteObserver<ModalRoute<void>>();

// ── Notification tap handler ──────────────────────────────────────────────────

/// Appelé par [NotificationService.onNotificationTap] sur l'isolate principal.
/// Navigue vers [HealthScreen] sur le bon onglet et lit le message en TTS.
void _handleNotificationTap(String type, String extra) async {
  // Laisse Flutter finir son initialisation si l'app vient de démarrer.
  await Future.delayed(const Duration(milliseconds: 500));

  final ctx = navigatorKey.currentContext;
  if (ctx == null) return;

  final langCode = ctx.locale.languageCode;
  final tab = type == 'medication' ? 0 : 1;

  // Ouvre HealthScreen sur le bon onglet, sans TTS de lancement.
  navigatorKey.currentState?.push(
    MaterialPageRoute(
      builder: (_) => HealthScreen(initialTab: tab, suppressInitTts: true),
    ),
  );

  // Initialise TTS dans la bonne langue, puis lit le message de la notif.
  await TtsService.instance.init(langCode);
  await Future.delayed(const Duration(milliseconds: 300));

  final text = type == 'medication'
      ? 'notif_med_tts'.tr(namedArgs: {'name': extra})
      : 'notif_appt_tts'.tr(namedArgs: {'body': extra});

  await TtsService.instance.speak(text);
}

// ── App entry point ───────────────────────────────────────────────────────────

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  // Branche le handler avant init() pour qu'il soit disponible dès le premier
  // tap de notification (y compris si l'app démarre depuis une notif).
  NotificationService.setTapHandler(_handleNotificationTap);
  await NotificationService.instance.init();

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('fr'), Locale('en'), Locale('ar')],
      path: 'assets/translations',
      fallbackLocale: const Locale('fr'),
      child: const OFaciliteApp(),
    ),
  );
}

class OFaciliteApp extends StatelessWidget {
  const OFaciliteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "O'Facilit",
      debugShowCheckedModeBanner: false,
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      navigatorKey: navigatorKey,
      theme: AppTheme.light,
      navigatorObservers: [routeObserver],
      home: const HomeScreen(),
    );
  }
}
