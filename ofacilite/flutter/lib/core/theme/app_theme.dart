import 'package:flutter/material.dart';

/// Palette officielle O'Survie.
class AppColors {
  AppColors._();

  static const primary = Color(0xFFD4A843); // Doré principal
  static const dark = Color(0xFF5C3D1E); // Brun foncé
  static const cream = Color(0xFFF0E8C8); // Beige crème
  static const text = Color(0xFF3D2B1F); // Brun très foncé
  static const white = Color(0xFFFFFFFF); // Blanc
}

/// Thème Material3 O'Facilit.
class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.cream,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          onPrimary: AppColors.dark,
          surface: AppColors.white,
          onSurface: AppColors.text,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.dark,
          foregroundColor: AppColors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.dark,
          ),
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.dark,
        ),
        tabBarTheme: const TabBarThemeData(
          indicatorColor: AppColors.primary,
          labelColor: AppColors.white,
          unselectedLabelColor: Colors.white60,
        ),
      );
}
