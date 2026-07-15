import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:ofacilite/core/services/api_service.dart';
import 'package:ofacilite/core/services/tts_service.dart';
import 'package:ofacilite/core/theme/app_theme.dart';
import 'package:ofacilite/shared/widgets/accessible_button.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen>
    with SingleTickerProviderStateMixin {
  FlutterTts get _tts => TtsService.instance.tts;
  final SpeechToText _stt = SpeechToText();

  bool _ttsInitialized = false;
  bool _sttAvailable = false;
  bool _isListening = false;
  String _transcribedText = '';

  String? _answer;
  bool _isAsking = false;
  bool _answerFailed = false;

  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.18).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _initStt();
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
    if (mounted) await _tts.speak('help_tts_intro'.tr());
  }

  Future<void> _callNumber(String number) async {
    final uri = Uri(scheme: 'tel', path: number);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _initStt() async {
    _sttAvailable = await _stt.initialize(
      onError: (_) => _stopListening(),
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          if (mounted) _stopListening();
        }
      },
    );
    print('[STT] available: $_sttAvailable');
    if (mounted) setState(() {});
  }

  void _stopListening() {
    if (!mounted || !_isListening) return;
    setState(() => _isListening = false);
    _pulseController.stop();
    _pulseController.reset();
  }

  String _sttLocale() => switch (context.locale.languageCode) {
        'ar' => 'ar_SA',
        'en' => 'en_US',
        _ => 'fr_FR',
      };

  Future<void> _startListening() async {
    if (!_sttAvailable || _isListening) return;
    await _tts.stop();
    setState(() {
      _transcribedText = '';
      _isListening = true;
      _answer = null;
      _isAsking = false;
      _answerFailed = false;
    });
    _pulseController.repeat(reverse: true);
    await _stt.listen(
      onResult: (result) {
        setState(() => _transcribedText = result.recognizedWords);
      },
      localeId: _sttLocale(),
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
    );
  }

  Future<void> _askQuestion() async {
    if (_transcribedText.isEmpty || _isAsking) return;
    final question = _transcribedText;
    final lang = context.locale.languageCode;
    setState(() {
      _isAsking = true;
      _answer = null;
      _answerFailed = false;
    });
    final answer = await ApiService.instance.ask(question, lang);
    if (!mounted) return;
    if (answer != null) {
      setState(() {
        _answer = answer;
        _isAsking = false;
      });
      await _tts.stop();
      await _tts.speak(answer);
    } else {
      setState(() {
        _isAsking = false;
        _answerFailed = true;
      });
    }
  }

  void _reset() {
    _stt.cancel();
    _tts.stop();
    setState(() {
      _transcribedText = '';
      _isListening = false;
      _answer = null;
      _isAsking = false;
      _answerFailed = false;
    });
    _pulseController.stop();
    _pulseController.reset();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _tts.stop();
    _stt.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('help_title'.tr()),
        backgroundColor: AppColors.dark,
        foregroundColor: AppColors.white,
      ),
      body: Column(
        children: [
          Expanded(
            flex: 3,
            child: _buildVoiceSection(),
          ),
          const Divider(height: 1, thickness: 1),
          Expanded(
            flex: 2,
            child: _buildEmergencySection(),
          ),
        ],
      ),
    );
  }

  Widget _buildVoiceSection() {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight - 48),
          child: Column(
            mainAxisAlignment: _transcribedText.isEmpty
                ? MainAxisAlignment.center
                : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              ScaleTransition(
                scale: _pulseAnimation,
                child: AccessibleButton(
                  description: 'help_desc_mic'.tr(),
                  onTap: (_isListening || _isAsking) ? null : _startListening,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isListening
                          ? const Color(0xFFD32F2F)
                          : AppColors.primary,
                      boxShadow: [
                        BoxShadow(
                          color: (_isListening
                                  ? const Color(0xFFD32F2F)
                                  : AppColors.primary)
                              .withOpacity(0.4),
                          blurRadius: 20,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      _isListening ? Icons.mic : Icons.mic_none_rounded,
                      size: 64,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                _isListening
                    ? 'help_listening'.tr()
                    : 'help_tap_to_speak'.tr(),
                style: TextStyle(
                  fontSize: 18,
                  color: _isListening
                      ? const Color(0xFFD32F2F)
                      : const Color(0xFF888888),
                  fontWeight:
                      _isListening ? FontWeight.bold : FontWeight.normal,
                ),
              ),
              if (_transcribedText.isNotEmpty) ...[
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.cream,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primary,
                      width: 1.5,
                    ),
                  ),
                  child: Text(
                    _transcribedText,
                    style: const TextStyle(
                      fontSize: 20,
                      color: Color(0xFF333333),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 12),

                // Bouton "Obtenir une réponse"
                if (!_isAsking && _answer == null && !_answerFailed)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _askQuestion,
                      icon: const Icon(Icons.auto_awesome_rounded, size: 22),
                      label: Text(
                        'help_ask_button'.tr(),
                        style: const TextStyle(fontSize: 18),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.dark,
                        minimumSize: const Size.fromHeight(56),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),

                // Indicateur de chargement
                if (_isAsking) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
                          strokeWidth: 2.5,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'help_asking'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          color: Color(0xFF555555),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                ],

                // Réponse de l'IA
                if (_answer != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF4CAF50),
                        width: 1.5,
                      ),
                    ),
                    child: Text(
                      _answer!,
                      style: const TextStyle(
                        fontSize: 18,
                        color: Color(0xFF1B5E20),
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF8E1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFFFFB300),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      'help_disclaimer'.tr(),
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF6D4C41),
                        height: 1.45,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],

                // Erreur / hors ligne
                if (_answerFailed)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.cloud_off,
                          size: 16,
                          color: Color(0xFF999999),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            'help_answer_error'.tr(),
                            style: const TextStyle(
                              fontSize: 15,
                              color: Color(0xFF999999),
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: _isAsking ? null : _reset,
                  icon: const Icon(Icons.refresh_rounded),
                  label: Text(
                    'help_retry'.tr(),
                    style: const TextStyle(fontSize: 18),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmergencySection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'help_emergencies'.tr(),
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF333333),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: AccessibleButton(
                    description: 'help_desc_samu'.tr(),
                    onTap: () => _callNumber('15'),
                    child: _EmergencyButton(
                      emoji: '🚑',
                      label: 'help_samu'.tr(),
                      number: '15',
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: AccessibleButton(
                    description: 'help_desc_police'.tr(),
                    onTap: () => _callNumber('17'),
                    child: _EmergencyButton(
                      emoji: '🚔',
                      label: 'help_police'.tr(),
                      number: '17',
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: AccessibleButton(
                    description: 'help_desc_pompiers'.tr(),
                    onTap: () => _callNumber('18'),
                    child: _EmergencyButton(
                      emoji: '🚒',
                      label: 'help_pompiers'.tr(),
                      number: '18',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmergencyButton extends StatelessWidget {
  const _EmergencyButton({
    required this.emoji,
    required this.label,
    required this.number,
  });

  final String emoji;
  final String label;
  final String number;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: ElevatedButton(
        onPressed: null,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFD32F2F),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFFD32F2F),
          disabledForegroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 28)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Text(
              number,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
