import 'dart:async';
import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  TtsService._();
  static final TtsService instance = TtsService._();

  final FlutterTts tts = FlutterTts();
  Completer<void>? _completer;

  Future<void> init(String languageCode) async {
    final lang = switch (languageCode) {
      'ar' => 'ar-SA',
      'en' => 'en-US',
      _ => 'fr-FR',
    };
    await tts.setLanguage(lang);
    await tts.setSpeechRate(0.45);
    await tts.setVolume(1.0);

    tts.setCompletionHandler(_onDone);
    tts.setCancelHandler(_onDone);
    tts.setErrorHandler((_) => _onDone());
  }

  void _onDone() {
    if (_completer != null && !_completer!.isCompleted) {
      _completer!.complete();
    }
  }

  Future<void> speak(String text) async {
    // Nullifie avant stop() : les cancel events asynchrones du stop
    // trouveront _completer == null et seront ignorés par _onDone.
    _completer = null;
    await tts.stop();
    await Future.delayed(const Duration(milliseconds: 50));
    _completer = Completer<void>();
    await tts.speak(text);
    await _completer!.future.timeout(
      const Duration(seconds: 15),
      onTimeout: () {},
    );
  }

  /// Restaure les handlers vers [_onDone] après un usage temporaire externe.
  void resetHandlers() {
    tts.setCompletionHandler(_onDone);
    tts.setCancelHandler(_onDone);
    tts.setErrorHandler((_) => _onDone());
  }

  Future<void> stop() async {
    await tts.stop();
    _onDone();
  }
}