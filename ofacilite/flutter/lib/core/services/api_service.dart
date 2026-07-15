import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  String? _baseUrl;
  bool _initialized = false;

  Future<void> _ensureInit() async {
    if (_initialized) return;
    try {
      final raw = await rootBundle.loadString('assets/config/api_config.json');
      final config = jsonDecode(raw) as Map<String, dynamic>;
      _baseUrl = config['base_url'] as String?;
    } catch (_) {
      _baseUrl = null;
    }
    _initialized = true;
  }

  Future<String?> ask(String question, String language) async {
    await _ensureInit();
    if (_baseUrl == null || _baseUrl!.isEmpty) return null;
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/api/ask'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'question': question, 'language': language}),
          )
          .timeout(const Duration(seconds: 180));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data['answer'] as String?;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<String?> summarize(String text, String language) async {
    await _ensureInit();
    if (_baseUrl == null || _baseUrl!.isEmpty) return null;
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/api/summarize'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'text': text, 'language': language}),
          )
          .timeout(const Duration(seconds: 180));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data['summary'] as String?;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
