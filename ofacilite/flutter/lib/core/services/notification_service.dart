import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final _plugin = FlutterLocalNotificationsPlugin();

  // ── Notification tap handler ────────────────────────────────────────────────

  /// Payload de la notification qui a lancé l'app depuis l'état fermé.
  /// Renseigné dans [init] via getNotificationAppLaunchDetails, consommé
  /// une seule fois par HomeScreen au démarrage.
  static Map<String, dynamic>? launchPayload;

  /// Callback appelé par [onNotificationTap] avec le type et le contenu
  /// décodés du payload JSON. À brancher depuis main.dart avant [init].
  static void Function(String type, String extra)? _tapHandler;

  static void setTapHandler(
    void Function(String type, String extra) handler,
  ) {
    _tapHandler = handler;
  }

  /// Gestionnaire principal des taps de notification (isolate principal).
  /// Référencé directement dans [init] comme callback du plugin.
  static void onNotificationTap(NotificationResponse response) {
    final payload = response.payload;
    if (payload == null || payload.isEmpty) return;
    try {
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final type = data['type'] as String? ?? '';
      final extra = type == 'medication'
          ? (data['name'] as String? ?? '')
          : (data['body'] as String? ?? '');
      _tapHandler?.call(type, extra);
    } catch (e) {
      debugPrint('[Notif] onNotificationTap parse error: $e');
    }
  }

  static final _medicationDetails = NotificationDetails(
    android: AndroidNotificationDetails(
      'medication_channel',
      'Médicaments',
      channelDescription: 'Rappels de médicaments',
      importance: Importance.high,
      priority: Priority.high,
    ),
  );

  static final _appointmentDetails = NotificationDetails(
    android: AndroidNotificationDetails(
      'appointment_channel',
      'Rendez-vous',
      channelDescription: 'Rappels de rendez-vous',
      importance: Importance.high,
      priority: Priority.high,
    ),
  );

  Future<void> init() async {
    tz_data.initializeTimeZones();

    final String timeZoneName = await FlutterTimezone.getLocalTimezone();
    tz.setLocalLocation(tz.getLocation(timeZoneName));

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _plugin.initialize(
      const InitializationSettings(android: androidSettings),
      onDidReceiveNotificationResponse: NotificationService.onNotificationTap,
      onDidReceiveBackgroundNotificationResponse: onBackgroundNotification,
    );

    await Permission.notification.request();

    // Détecte si l'app a été lancée depuis l'état fermé via un tap de notif.
    final launchDetails = await _plugin.getNotificationAppLaunchDetails();
    if (launchDetails?.didNotificationLaunchApp == true) {
      final raw = launchDetails?.notificationResponse?.payload;
      if (raw != null && raw.isNotEmpty) {
        try {
          launchPayload = jsonDecode(raw) as Map<String, dynamic>;
          debugPrint('[Notif] cold-start payload: $launchPayload');
        } catch (e) {
          debugPrint('[Notif] launchPayload parse error: $e');
        }
      }
    }

    debugPrint('[Notif] timezone: ${tz.local.name}');
  }

  Future<void> scheduleDaily(
    int id,
    String title,
    String body,
    TimeOfDay time,
  ) async {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      time.hour,
      time.minute,
    );
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    debugPrint('[Notif] scheduled at: $scheduled (now: $now)');
    try {
      await _plugin.zonedSchedule(
        id,
        title,
        body,
        scheduled,
        _medicationDetails,
        payload: jsonEncode({'type': 'medication', 'name': body}),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.time,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (e) {
      debugPrint('[Notif] scheduleDaily failed: $e');
    }
  }

  Future<void> scheduleOnce(
    int id,
    String title,
    String body,
    DateTime dateTime,
  ) async {
    if (dateTime.isBefore(DateTime.now())) return;
    try {
      await _plugin.zonedSchedule(
        id,
        title,
        body,
        tz.TZDateTime.from(dateTime, tz.local),
        _appointmentDetails,
        payload: jsonEncode({'type': 'appointment', 'body': body}),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (e) {
      debugPrint('[Notif] scheduleOnce failed: $e');
    }
  }

  Future<void> cancel(int id) => _plugin.cancel(id);
}

/// Gestionnaire background (isolate séparé, requis top-level).
/// Les plugins Flutter ne sont pas disponibles sur cet isolate :
/// les taps de notification sont pris en charge par
/// [NotificationService.onNotificationTap] sur l'isolate principal.
@pragma('vm:entry-point')
void onBackgroundNotification(NotificationResponse response) {}
