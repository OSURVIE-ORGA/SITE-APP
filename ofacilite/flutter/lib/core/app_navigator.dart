import 'package:flutter/material.dart';

/// Clé globale du Navigator principal, partagée entre main.dart
/// et tout code qui doit naviguer sans BuildContext (ex. notification tap).
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
