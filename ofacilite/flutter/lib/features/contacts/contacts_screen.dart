import 'dart:io';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:ofacilite/core/services/tts_service.dart';
import 'package:ofacilite/core/theme/app_theme.dart';
import 'package:ofacilite/shared/widgets/accessible_button.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:ofacilite/core/database/database_provider.dart';

class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key});

  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  FlutterTts get _tts => TtsService.instance.tts;
  final ImagePicker _picker = ImagePicker();
  List<Contact> _contacts = [];
  final Map<String, String?> _localPhotos = {};
  bool _loading = true;
  bool _permissionDenied = false;

  @override
  void initState() {
    super.initState();
    _initTts();
    _loadContacts();
  }

  Future<void> _initTts() async {
    await TtsService.instance.init(context.locale.languageCode);
    await Future.delayed(const Duration(milliseconds: 800));
    await _tts.speak('contacts_tts_intro'.tr());
  }

  Future<void> _loadContacts() async {
    final granted = await FlutterContacts.requestPermission(readonly: true);
    if (!granted) {
      setState(() {
        _permissionDenied = true;
        _loading = false;
      });
      return;
    }
    final all = await FlutterContacts.getContacts(
      withProperties: true,
      withPhoto: true,
    );
    final withPhone = all.where((c) => c.phones.isNotEmpty).toList();

    for (final contact in withPhone) {
      _localPhotos[contact.id] =
          await appDatabase.getPhotoForContact(contact.id);
    }

    setState(() {
      _contacts = withPhone;
      _loading = false;
    });
  }

  Future<void> _call(String number) async {
    final uri = Uri(scheme: 'tel', path: number);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _sendPhoto(Contact contact) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AccessibleButton(
              description: 'contacts_camera'.tr(),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
              child: ListTile(
                leading: const Icon(Icons.camera_alt, size: 28),
                title: Text(
                  'contacts_camera'.tr(),
                  style: const TextStyle(fontSize: 20),
                ),
                onTap: null,
              ),
            ),
            AccessibleButton(
              description: 'contacts_gallery'.tr(),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              child: ListTile(
                leading: const Icon(Icons.photo_library, size: 28),
                title: Text(
                  'contacts_gallery'.tr(),
                  style: const TextStyle(fontSize: 20),
                ),
                onTap: null,
              ),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final picked = await _picker.pickImage(source: source);
    if (picked == null) return;

    await Share.shareXFiles(
      [XFile(picked.path)],
      text: 'Photo pour ${contact.displayName}',
    );
  }

  Future<void> _changePhoto(Contact contact) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AccessibleButton(
              description: 'contacts_camera'.tr(),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
              child: ListTile(
                leading: const Icon(Icons.camera_alt, size: 28),
                title: Text(
                  'contacts_camera'.tr(),
                  style: const TextStyle(fontSize: 20),
                ),
                onTap: null,
              ),
            ),
            AccessibleButton(
              description: 'contacts_gallery'.tr(),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              child: ListTile(
                leading: const Icon(Icons.photo_library, size: 28),
                title: Text(
                  'contacts_gallery'.tr(),
                  style: const TextStyle(fontSize: 20),
                ),
                onTap: null,
              ),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final picked = await _picker.pickImage(source: source);
    if (picked == null) return;

    await appDatabase.savePhotoForContact(contact.id, picked.path);
    setState(() {
      _localPhotos[contact.id] = picked.path;
    });
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('contacts_title'.tr()),
        backgroundColor: AppColors.dark,
        foregroundColor: AppColors.white,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_permissionDenied) {
      return Center(
        child: Text(
          'contacts_no_permission'.tr(),
          style: const TextStyle(fontSize: 20, color: Color(0xFF555555)),
        ),
      );
    }
    if (_contacts.isEmpty) {
      return Center(
        child: Text(
          'contacts_empty'.tr(),
          style: const TextStyle(fontSize: 20, color: Color(0xFF555555)),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 12),
      itemCount: _contacts.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (_, index) {
        final contact = _contacts[index];
        return _ContactTile(
          contact: contact,
          localPhotoPath: _localPhotos[contact.id],
          onCall: _call,
          onPhoto: _sendPhoto,
          onChangePhoto: _changePhoto,
        );
      },
    );
  }
}

class _ContactTile extends StatelessWidget {
  const _ContactTile({
    required this.contact,
    required this.localPhotoPath,
    required this.onCall,
    required this.onPhoto,
    required this.onChangePhoto,
  });

  final Contact contact;
  final String? localPhotoPath;
  final void Function(String) onCall;
  final void Function(Contact) onPhoto;
  final void Function(Contact) onChangePhoto;

  @override
  Widget build(BuildContext context) {
    final name = contact.displayName.isNotEmpty ? contact.displayName : '?';
    final firstName = name.split(' ').first;
    final initial = name[0].toUpperCase();
    final phone = contact.phones.first.number;

    final ImageProvider? avatarImage = localPhotoPath != null
        ? FileImage(File(localPhotoPath!))
        : contact.photo != null
            ? MemoryImage(contact.photo!)
            : null;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          AccessibleButton(
            description: 'contacts_desc_edit_photo'.tr(namedArgs: {'name': firstName}),
            onTap: () => onChangePhoto(contact),
            child: Stack(
              children: [
                avatarImage != null
                    ? CircleAvatar(
                        radius: 32,
                        backgroundImage: avatarImage,
                      )
                    : CircleAvatar(
                        radius: 32,
                        backgroundColor: AppColors.primary,
                        child: Text(
                          initial,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(2),
                    child: const Icon(
                      Icons.edit,
                      size: 14,
                      color: Color(0xFF555555),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              name,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 8),
          AccessibleButton(
            description: 'contacts_desc_call'.tr(namedArgs: {'name': firstName}),
            onTap: () => onCall(phone),
            child: ElevatedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.phone, size: 22),
              label: Text('contacts_call'.tr(), style: const TextStyle(fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.dark,
                disabledBackgroundColor: AppColors.primary,
                disabledForegroundColor: AppColors.dark,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: 8),
          AccessibleButton(
            description: 'contacts_desc_photo'.tr(namedArgs: {'name': firstName}),
            onTap: () => onPhoto(contact),
            child: ElevatedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.camera_alt, size: 22),
              label: Text('contacts_photo'.tr(), style: const TextStyle(fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.dark,
                foregroundColor: AppColors.white,
                disabledBackgroundColor: AppColors.dark,
                disabledForegroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
