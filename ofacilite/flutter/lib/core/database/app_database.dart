import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

class ContactPhotos extends Table {
  TextColumn get contactId => text()();
  TextColumn get photoPath => text()();

  @override
  Set<Column> get primaryKey => {contactId};
}

class Medications extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text()();
  TextColumn get photoPath => text().nullable()();
  IntColumn get notificationId => integer()();
}

class MedicationTimes extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get medicationId => integer()();
  IntColumn get hour => integer()();
  IntColumn get minute => integer()();
}

class Appointments extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get title => text()();
  TextColumn get doctorName => text()();
  DateTimeColumn get scheduledAt => dateTime()();
  IntColumn get notificationId => integer()();
}

@DriftDatabase(tables: [ContactPhotos, Medications, MedicationTimes, Appointments])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'ofacilite_db'));

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from < 2) {
        await m.createTable(medications);
        await m.createTable(medicationTimes);
        await m.createTable(appointments);
      }
    },
  );

  Future<String?> getPhotoForContact(String contactId) async {
    final row = await (select(contactPhotos)
          ..where((t) => t.contactId.equals(contactId)))
        .getSingleOrNull();
    return row?.photoPath;
  }

  Future<void> savePhotoForContact(String contactId, String photoPath) async {
    await into(contactPhotos).insertOnConflictUpdate(
      ContactPhotosCompanion(
        contactId: Value(contactId),
        photoPath: Value(photoPath),
      ),
    );
  }
}
