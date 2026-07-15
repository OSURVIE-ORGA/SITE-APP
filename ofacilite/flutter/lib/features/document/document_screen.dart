import 'dart:async';
import 'dart:io';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:ofacilite/core/services/api_service.dart';
import 'package:ofacilite/core/services/tts_service.dart';
import 'package:ofacilite/core/theme/app_theme.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ofacilite/shared/widgets/accessible_button.dart';

class DocumentScreen extends StatefulWidget {
  const DocumentScreen({super.key});

  @override
  State<DocumentScreen> createState() => _DocumentScreenState();
}

class _DocumentScreenState extends State<DocumentScreen> {
  FlutterTts get _tts => TtsService.instance.tts;
  final ImagePicker _picker = ImagePicker();

  File? _image;
  String? _extractedText;
  String? _summary;
  bool _analyzing = false;
  bool _summarizing = false;
  bool _summaryFailed = false;
  bool _ttsInitialized = false;
  Timer? _dotsTimer;
  int _dotCount = 1;

  String get _dots => _dotCount == 1 ? '.' : _dotCount == 2 ? '..' : '...';

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
    await _tts.speak('document_tts_intro'.tr());
  }

  void _startDotsAnimation() {
    _dotsTimer?.cancel();
    _dotCount = 1;
    _dotsTimer = Timer.periodic(const Duration(milliseconds: 600), (_) {
      if (mounted) {
        setState(() {
          _dotCount = _dotCount == 3 ? 1 : _dotCount + 1;
        });
      }
    });
  }

  void _stopDotsAnimation() {
    _dotsTimer?.cancel();
    _dotsTimer = null;
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source);
    if (picked == null) return;

    setState(() {
      _image = File(picked.path);
      _extractedText = null;
      _summary = null;
      _summarizing = false;
      _summaryFailed = false;
      _analyzing = true;
    });
    _startDotsAnimation();

    await _analyzeImage(picked.path);
  }

  Future<void> _analyzeImage(String path) async {
    final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
    try {
      final result = await recognizer.processImage(
        InputImage.fromFilePath(path),
      );
      final text = result.text.trim();

      if (text.isEmpty) {
        _stopDotsAnimation();
        setState(() {
          _extractedText = 'document_no_text'.tr();
          _analyzing = false;
        });
        await _tts.stop();
        await _tts.speak(_extractedText!);
        return;
      }

      setState(() {
        _extractedText = text;
        _analyzing = false;
        _summarizing = true;
      });

      await _fetchSummary(text);
    } finally {
      recognizer.close();
    }
  }

  Future<void> _fetchSummary(String text) async {
    final lang = context.locale.languageCode;
    final summary = await ApiService.instance.summarize(text, lang);

    await _tts.stop();
    if (!mounted) return;

    if (summary != null) {
      _stopDotsAnimation();
      setState(() {
        _summary = summary;
        _summarizing = false;
        _summaryFailed = false;
      });
      await _tts.speak(summary);
    } else {
      _stopDotsAnimation();
      setState(() {
        _summary = null;
        _summarizing = false;
        _summaryFailed = true;
      });
      await _tts.speak(text);
    }
  }

  void _reset() {
    _stopDotsAnimation();
    _tts.stop();
    setState(() {
      _image = null;
      _extractedText = null;
      _summary = null;
      _analyzing = false;
      _summarizing = false;
      _summaryFailed = false;
    });
  }

  @override
  void dispose() {
    _dotsTimer?.cancel();
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('document_title'.tr()),
        backgroundColor: AppColors.dark,
        foregroundColor: AppColors.white,
      ),
      body: _image == null ? _buildPicker() : _buildResult(),
    );
  }

  Widget _buildPicker() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AccessibleButton(
              description: 'document_desc_take_photo'.tr(),
              onTap: () => _pickImage(ImageSource.camera),
              child: ElevatedButton.icon(
                onPressed: null,
                icon: const Icon(Icons.camera_alt, size: 36),
                label: Text(
                  'document_take_photo'.tr(),
                  style: const TextStyle(fontSize: 22),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.dark,
                  disabledBackgroundColor: AppColors.primary,
                  disabledForegroundColor: AppColors.dark,
                  minimumSize: const Size.fromHeight(80),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            AccessibleButton(
              description: 'document_desc_gallery'.tr(),
              onTap: () => _pickImage(ImageSource.gallery),
              child: OutlinedButton.icon(
                onPressed: null,
                icon: const Icon(Icons.photo_library, size: 28),
                label: Text(
                  'document_gallery'.tr(),
                  style: const TextStyle(fontSize: 18),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  disabledForegroundColor: AppColors.primary,
                  minimumSize: const Size.fromHeight(60),
                  side: const BorderSide(color: AppColors.primary, width: 2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResult() {
    final isLoading = _analyzing || _summarizing;
    return Column(
      children: [
        SizedBox(
          height: 240,
          width: double.infinity,
          child: Image.file(_image!, fit: BoxFit.cover),
        ),
        Expanded(
          child: isLoading
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 72,
                          height: 72,
                          child: CircularProgressIndicator(
                            color: AppColors.primary,
                            strokeWidth: 5,
                          ),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          'document_loading_label'.tr() + _dots,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            height: 1.4,
                            color: Color(0xFF333333),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_summary != null) ...[
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.cream,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.primary,
                              width: 1.5,
                            ),
                          ),
                          child: Text(
                            _summary!,
                            style: const TextStyle(fontSize: 18, height: 1.6),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _extractedText ?? '',
                          style: const TextStyle(
                            fontSize: 14,
                            height: 1.5,
                            color: Color(0xFF999999),
                          ),
                        ),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.cream,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.primary,
                              width: 1.5,
                            ),
                          ),
                          child: Text(
                            _extractedText ?? '',
                            style: const TextStyle(fontSize: 18, height: 1.6),
                          ),
                        ),
                        if (_summaryFailed) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.cloud_off,
                                size: 14,
                                color: Color(0xFFBBBBBB),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'document_summary_offline'.tr(),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFFBBBBBB),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                      const SizedBox(height: 24),
                      AccessibleButton(
                        description: 'document_desc_new_photo'.tr(),
                        onTap: _reset,
                        child: ElevatedButton.icon(
                          onPressed: null,
                          icon: const Icon(Icons.refresh, size: 24),
                          label: Text(
                            'document_new_photo'.tr(),
                            style: const TextStyle(fontSize: 18),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: AppColors.dark,
                            disabledBackgroundColor: AppColors.primary,
                            disabledForegroundColor: AppColors.dark,
                            minimumSize: const Size.fromHeight(60),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}
