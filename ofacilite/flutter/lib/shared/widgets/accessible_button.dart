import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:ofacilite/core/services/tts_service.dart';

/// Widget réutilisable qui ajoute l'accessibilité vocale (TTS) à n'importe
/// quel enfant via un long press.
///
/// Au long press :
///  - le widget rétrécit légèrement (scale 0.95),
///  - un voile noir semi-transparent avec une icône 🔊 se superpose,
///  - puis tout revient à la normale dès que la lecture est terminée.
///
/// Exemple d'utilisation :
/// ```dart
/// AccessibleButton(
///   description: 'Appuyez pour envoyer le formulaire',
///   onTap: () => _submit(),
///   child: ElevatedButton(
///     onPressed: null, // tap géré par AccessibleButton
///     child: Text('Envoyer'),
///   ),
/// )
/// ```
class AccessibleButton extends StatefulWidget {
  const AccessibleButton({
    super.key,
    required this.child,
    required this.description,
    this.onTap,
    this.onLongPress,
  });

  /// Le widget à afficher (bouton, carte, conteneur, etc.).
  final Widget child;

  /// Texte lu à voix haute au long press.
  final String description;

  /// Callback déclenché au tap normal. Optionnel.
  final VoidCallback? onTap;

  /// Callback supplémentaire déclenché APRÈS la lecture TTS. Optionnel.
  final VoidCallback? onLongPress;

  @override
  State<AccessibleButton> createState() => _AccessibleButtonState();
}

class _AccessibleButtonState extends State<AccessibleButton> {
  bool _isSpeaking = false;

  @override
  void dispose() {
    if (_isSpeaking) TtsService.instance.stop();
    super.dispose();
  }

  Future<void> _handleLongPress() async {
    await TtsService.instance.stop();
    if (!mounted) return;

    await TtsService.instance.init(context.locale.languageCode);
    setState(() => _isSpeaking = true);

    try {
      await TtsService.instance.speak(widget.description);
    } finally {
      if (mounted) setState(() => _isSpeaking = false);
    }

    widget.onLongPress?.call();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _isSpeaking ? 0.95 : 1.0,
      duration: const Duration(milliseconds: 150),
      curve: Curves.easeInOut,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        onLongPress: _handleLongPress,
        // Stack : child natif + voile superposé via Positioned.fill.
        // IgnorePointer garantit que l'overlay n'intercepte jamais les taps.
        child: Stack(
          children: [
            widget.child,
            Positioned.fill(
              child: IgnorePointer(
                child: AnimatedOpacity(
                  opacity: _isSpeaking ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: ColoredBox(
                    color: Colors.black.withValues(alpha: 0.30),
                    child: const Center(
                      child: Icon(
                        Icons.volume_up_rounded,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
