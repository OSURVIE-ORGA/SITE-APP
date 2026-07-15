import 'dart:io';

import 'package:drift/drift.dart' show Value, OrderingTerm, ComparableExpr;
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:ofacilite/core/services/tts_service.dart';
import 'package:ofacilite/core/theme/app_theme.dart';
import 'package:ofacilite/shared/widgets/accessible_button.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ofacilite/core/database/app_database.dart';
import 'package:ofacilite/core/database/database_provider.dart';
import 'package:ofacilite/core/services/notification_service.dart';

class _MedicationWithTimes {
  final Medication medication;
  final List<MedicationTime> times;
  _MedicationWithTimes(this.medication, this.times);
}

class HealthScreen extends StatefulWidget {
  const HealthScreen({
    super.key,
    this.initialTab = 0,
    this.suppressInitTts = false,
  });

  /// Onglet affiché à l'ouverture : 0 = Médicaments, 1 = Rendez-vous.
  final int initialTab;

  /// Si true, le TTS de lancement est supprimé (ex. ouverture depuis notif).
  final bool suppressInitTts;

  @override
  State<HealthScreen> createState() => _HealthScreenState();
}

class _HealthScreenState extends State<HealthScreen>
    with SingleTickerProviderStateMixin {
  FlutterTts get _tts => TtsService.instance.tts;
  bool _ttsInitialized = false;

  late final TabController _tabController;
  List<_MedicationWithTimes> _medications = [];
  List<Appointment> _appointments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTab,
    );
    _loadData();
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
    if (widget.suppressInitTts) return;
    await TtsService.instance.init(context.locale.languageCode);
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) await _tts.speak('health_tts_intro'.tr());
  }

  Future<void> _loadData() async {
    final meds = await appDatabase.select(appDatabase.medications).get();
    final medicationsWithTimes = <_MedicationWithTimes>[];
    for (final med in meds) {
      final times = await (appDatabase.select(appDatabase.medicationTimes)
            ..where((t) => t.medicationId.equals(med.id)))
          .get();
      medicationsWithTimes.add(_MedicationWithTimes(med, times));
    }

    final appts = await (appDatabase.select(appDatabase.appointments)
          ..where((t) => t.scheduledAt.isBiggerOrEqualValue(DateTime.now()))
          ..orderBy([(t) => OrderingTerm.asc(t.scheduledAt)]))
        .get();

    if (mounted) {
      setState(() {
        _medications = medicationsWithTimes;
        _appointments = appts;
        _loading = false;
      });
    }
  }

  // ── Medication ──────────────────────────────────────────────────────────────

  Future<void> _showAddMedicationDialog() async {
    final nameController = TextEditingController();
    final times = <TimeOfDay>[const TimeOfDay(hour: 8, minute: 0)];
    String? photoPath;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('health_add_medication'.tr(),
              style: const TextStyle(fontSize: 20)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: 'health_med_name'.tr(),
                    border: const OutlineInputBorder(),
                  ),
                  style: const TextStyle(fontSize: 18),
                  textCapitalization: TextCapitalization.sentences,
                ),
                const SizedBox(height: 16),
                ...times.asMap().entries.map((entry) {
                  final i = entry.key;
                  final t = entry.value;
                  final label =
                      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.access_time),
                            label: Text(label,
                                style: const TextStyle(fontSize: 18)),
                            onPressed: () async {
                              final picked = await showTimePicker(
                                  context: ctx, initialTime: t);
                              if (picked != null) {
                                setDialogState(() => times[i] = picked);
                              }
                            },
                          ),
                        ),
                        if (times.length > 1)
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline,
                                color: Colors.red),
                            onPressed: () =>
                                setDialogState(() => times.removeAt(i)),
                          ),
                      ],
                    ),
                  );
                }),
                TextButton.icon(
                  icon: const Icon(Icons.add),
                  label: Text('health_add_time'.tr()),
                  onPressed: times.length < 6
                      ? () => setDialogState(() =>
                          times.add(const TimeOfDay(hour: 12, minute: 0)))
                      : null,
                ),
                const Divider(),
                Text('Photo (optionnel)',
                    style: TextStyle(fontSize: 14, color: Colors.grey[600])),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.photo_library),
                        label: Text('health_gallery'.tr()),
                        onPressed: () async {
                          final img = await ImagePicker()
                              .pickImage(source: ImageSource.gallery);
                          if (img != null) {
                            setDialogState(() => photoPath = img.path);
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.camera_alt),
                        label: Text('health_camera'.tr()),
                        onPressed: () async {
                          final img = await ImagePicker()
                              .pickImage(source: ImageSource.camera);
                          if (img != null) {
                            setDialogState(() => photoPath = img.path);
                          }
                        },
                      ),
                    ),
                  ],
                ),
                if (photoPath != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'health_photo_selected'.tr(),
                      style: const TextStyle(
                          color: AppColors.primary, fontSize: 14),
                    ),
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: Text('health_cancel'.tr()),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.dark),
              onPressed: () async {
                final name = nameController.text.trim();
                if (name.isEmpty) return;
                Navigator.pop(dialogCtx);
                await _addMedication(name, List.from(times), photoPath);
              },
              child: Text('health_save'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addMedication(
      String name, List<TimeOfDay> times, String? photoPath) async {
    final medId = await appDatabase.into(appDatabase.medications).insert(
          MedicationsCompanion(
            name: Value(name),
            photoPath: Value(photoPath),
            notificationId: const Value(0),
          ),
        );

    final baseNotifId = medId * 1000;
    await (appDatabase.update(appDatabase.medications)
          ..where((t) => t.id.equals(medId)))
        .write(MedicationsCompanion(notificationId: Value(baseNotifId)));

    for (var i = 0; i < times.length; i++) {
      await appDatabase.into(appDatabase.medicationTimes).insert(
            MedicationTimesCompanion(
              medicationId: Value(medId),
              hour: Value(times[i].hour),
              minute: Value(times[i].minute),
            ),
          );
      await NotificationService.instance.scheduleDaily(
        baseNotifId + i,
        'health_notif_med'.tr(),
        name,
        times[i],
      );
    }
    await _loadData();
  }

  Future<void> _deleteMedication(_MedicationWithTimes mwt) async {
    for (var i = 0; i < mwt.times.length; i++) {
      await NotificationService.instance
          .cancel(mwt.medication.notificationId + i);
    }
    await (appDatabase.delete(appDatabase.medicationTimes)
          ..where((t) => t.medicationId.equals(mwt.medication.id)))
        .go();
    await (appDatabase.delete(appDatabase.medications)
          ..where((t) => t.id.equals(mwt.medication.id)))
        .go();
    await _loadData();
  }

  // ── Appointment ─────────────────────────────────────────────────────────────

  Future<void> _showAddAppointmentDialog() async {
    final reasonController = TextEditingController();
    final doctorController = TextEditingController();
    var selectedDate = DateTime.now().add(const Duration(days: 1));
    var selectedTime = const TimeOfDay(hour: 9, minute: 0);

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('health_add_appointment'.tr(),
              style: const TextStyle(fontSize: 20)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: reasonController,
                  decoration: InputDecoration(
                    labelText: 'health_appt_reason'.tr(),
                    border: const OutlineInputBorder(),
                  ),
                  style: const TextStyle(fontSize: 18),
                  textCapitalization: TextCapitalization.sentences,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: doctorController,
                  decoration: InputDecoration(
                    labelText: 'health_doctor_name'.tr(),
                    border: const OutlineInputBorder(),
                  ),
                  style: const TextStyle(fontSize: 18),
                  textCapitalization: TextCapitalization.words,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.calendar_today),
                    label: Text(
                      '${selectedDate.day.toString().padLeft(2, '0')}/${selectedDate.month.toString().padLeft(2, '0')}/${selectedDate.year}',
                      style: const TextStyle(fontSize: 18),
                    ),
                    onPressed: () async {
                      final picked = await showDatePicker(
                        context: ctx,
                        initialDate: selectedDate,
                        firstDate: DateTime.now(),
                        lastDate:
                            DateTime.now().add(const Duration(days: 730)),
                      );
                      if (picked != null) {
                        setDialogState(() => selectedDate = picked);
                      }
                    },
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.access_time),
                    label: Text(
                      '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}',
                      style: const TextStyle(fontSize: 18),
                    ),
                    onPressed: () async {
                      final picked = await showTimePicker(
                          context: ctx, initialTime: selectedTime);
                      if (picked != null) {
                        setDialogState(() => selectedTime = picked);
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: Text('health_cancel'.tr()),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.dark),
              onPressed: () async {
                final reason = reasonController.text.trim();
                final doctor = doctorController.text.trim();
                if (reason.isEmpty || doctor.isEmpty) return;
                Navigator.pop(dialogCtx);
                final dateTime = DateTime(
                  selectedDate.year,
                  selectedDate.month,
                  selectedDate.day,
                  selectedTime.hour,
                  selectedTime.minute,
                );
                await _addAppointment(reason, doctor, dateTime);
              },
              child: Text('health_save'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addAppointment(
      String reason, String doctor, DateTime dateTime) async {
    final apptId = await appDatabase.into(appDatabase.appointments).insert(
          AppointmentsCompanion(
            title: Value(reason),
            doctorName: Value(doctor),
            scheduledAt: Value(dateTime),
            notificationId: const Value(0),
          ),
        );

    final baseNotifId = 2000000 + apptId * 2;
    await (appDatabase.update(appDatabase.appointments)
          ..where((t) => t.id.equals(apptId)))
        .write(AppointmentsCompanion(notificationId: Value(baseNotifId)));

    final body = '$doctor — $reason';
    final dayBeforeDate = dateTime.subtract(const Duration(days: 1));
    final dayBefore =
        DateTime(dayBeforeDate.year, dayBeforeDate.month, dayBeforeDate.day, 18, 0);
    await NotificationService.instance.scheduleOnce(
        baseNotifId, 'health_notif_appt_eve'.tr(), body, dayBefore);
    await NotificationService.instance.scheduleOnce(
        baseNotifId + 1,
        'health_notif_appt_soon'.tr(),
        body,
        dateTime.subtract(const Duration(hours: 1)));

    await _loadData();
  }

  Future<void> _deleteAppointment(Appointment appt) async {
    await NotificationService.instance.cancel(appt.notificationId);
    await NotificationService.instance.cancel(appt.notificationId + 1);
    await (appDatabase.delete(appDatabase.appointments)
          ..where((t) => t.id.equals(appt.id)))
        .go();
    await _loadData();
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  @override
  void dispose() {
    _tabController.dispose();
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('health_title'.tr()),
        backgroundColor: AppColors.dark,
        foregroundColor: AppColors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: Colors.white,
          tabs: [
            Tab(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onLongPress: () => TtsService.instance.speak(
                  'health_desc_tab_med'.tr(),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.medication_rounded),
                    const SizedBox(height: 2),
                    Text('health_tab_medications'.tr()),
                  ],
                ),
              ),
            ),
            Tab(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onLongPress: () => TtsService.instance.speak(
                  'health_desc_tab_appt'.tr(),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.calendar_month_rounded),
                    const SizedBox(height: 2),
                    Text('health_tab_appointments'.tr()),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: AnimatedBuilder(
        animation: _tabController,
        builder: (_, __) => AccessibleButton(
          description: _tabController.index == 0
              ? 'health_desc_fab_med'.tr()
              : 'health_desc_fab_appt'.tr(),
          onTap: null,
          child: FloatingActionButton(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.dark,
            onPressed: () => _tabController.index == 0
                ? _showAddMedicationDialog()
                : _showAddAppointmentDialog(),
            child: const Icon(Icons.add, size: 32),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildMedicationsTab(),
                _buildAppointmentsTab(),
              ],
            ),
    );
  }

  Widget _buildMedicationsTab() {
    if (_medications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.medication_rounded,
                size: 72, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('health_no_medications'.tr(),
                style: const TextStyle(fontSize: 20, color: Color(0xFF888888)),
                textAlign: TextAlign.center),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _medications.length,
      itemBuilder: (_, i) => _medicationCard(_medications[i]),
    );
  }

  Widget _medicationCard(_MedicationWithTimes mwt) {
    final timesLabel = mwt.times
        .map((t) =>
            '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}')
        .join(' • ');
    final timesTts = mwt.times
        .map((t) =>
            '${t.hour.toString().padLeft(2, '0')}h${t.minute.toString().padLeft(2, '0')}')
        .join(', ');

    return Dismissible(
      key: Key('med_${mwt.medication.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        color: Colors.red,
        padding: const EdgeInsets.only(right: 24),
        child: const Icon(Icons.delete_rounded, color: Colors.white, size: 36),
      ),
      onDismissed: (_) => _deleteMedication(mwt),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: _MedicationAvatar(medication: mwt.medication),
          title: Text(mwt.medication.name,
              style:
                  const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          subtitle: timesLabel.isNotEmpty
              ? Text(timesLabel,
                  style: const TextStyle(
                      fontSize: 16, color: Color(0xFF555555)))
              : null,
          onLongPress: () => TtsService.instance.speak(
            'health_desc_med'.tr(namedArgs: {
              'name': mwt.medication.name,
              'times': timesTts,
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildAppointmentsTab() {
    if (_appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.calendar_month_rounded,
                size: 72, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('health_no_appointments'.tr(),
                style: const TextStyle(fontSize: 20, color: Color(0xFF888888)),
                textAlign: TextAlign.center),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _appointments.length,
      itemBuilder: (_, i) => _appointmentCard(_appointments[i]),
    );
  }

  Widget _appointmentCard(Appointment appt) {
    final dt = appt.scheduledAt;
    final dateLabel =
        '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    final timeLabel =
        '${dt.hour.toString().padLeft(2, '0')}h${dt.minute.toString().padLeft(2, '0')}';

    return Dismissible(
      key: Key('appt_${appt.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        color: Colors.red,
        padding: const EdgeInsets.only(right: 24),
        child: const Icon(Icons.delete_rounded, color: Colors.white, size: 36),
      ),
      onDismissed: (_) => _deleteAppointment(appt),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: const CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.primary,
            child: Icon(Icons.calendar_month_rounded,
                size: 28, color: AppColors.dark),
          ),
          title: Text(appt.doctorName,
              style:
                  const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(appt.title,
                  style: const TextStyle(
                      fontSize: 16, color: Color(0xFF555555))),
              Text(
                '$dateLabel à $timeLabel',
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.dark),
              ),
            ],
          ),
          isThreeLine: true,
          onLongPress: () => TtsService.instance.speak(
            'health_desc_appt'.tr(namedArgs: {
              'doctor': appt.doctorName,
              'reason': appt.title,
              'date': dateLabel,
              'time': timeLabel,
            }),
          ),
        ),
      ),
    );
  }
}

class _MedicationAvatar extends StatelessWidget {
  const _MedicationAvatar({required this.medication});
  final Medication medication;

  @override
  Widget build(BuildContext context) {
    final path = medication.photoPath;
    if (path != null && File(path).existsSync()) {
      return CircleAvatar(
        radius: 28,
        backgroundImage: FileImage(File(path)),
      );
    }
    return const CircleAvatar(
      radius: 28,
      backgroundColor: AppColors.primary,
      child: Icon(Icons.medication_rounded, size: 28, color: AppColors.dark),
    );
  }
}
