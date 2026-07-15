// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $ContactPhotosTable extends ContactPhotos
    with TableInfo<$ContactPhotosTable, ContactPhoto> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ContactPhotosTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _contactIdMeta = const VerificationMeta(
    'contactId',
  );
  @override
  late final GeneratedColumn<String> contactId = GeneratedColumn<String>(
    'contact_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _photoPathMeta = const VerificationMeta(
    'photoPath',
  );
  @override
  late final GeneratedColumn<String> photoPath = GeneratedColumn<String>(
    'photo_path',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [contactId, photoPath];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'contact_photos';
  @override
  VerificationContext validateIntegrity(
    Insertable<ContactPhoto> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('contact_id')) {
      context.handle(
        _contactIdMeta,
        contactId.isAcceptableOrUnknown(data['contact_id']!, _contactIdMeta),
      );
    } else if (isInserting) {
      context.missing(_contactIdMeta);
    }
    if (data.containsKey('photo_path')) {
      context.handle(
        _photoPathMeta,
        photoPath.isAcceptableOrUnknown(data['photo_path']!, _photoPathMeta),
      );
    } else if (isInserting) {
      context.missing(_photoPathMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {contactId};
  @override
  ContactPhoto map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ContactPhoto(
      contactId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}contact_id'],
      )!,
      photoPath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_path'],
      )!,
    );
  }

  @override
  $ContactPhotosTable createAlias(String alias) {
    return $ContactPhotosTable(attachedDatabase, alias);
  }
}

class ContactPhoto extends DataClass implements Insertable<ContactPhoto> {
  final String contactId;
  final String photoPath;
  const ContactPhoto({required this.contactId, required this.photoPath});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['contact_id'] = Variable<String>(contactId);
    map['photo_path'] = Variable<String>(photoPath);
    return map;
  }

  ContactPhotosCompanion toCompanion(bool nullToAbsent) {
    return ContactPhotosCompanion(
      contactId: Value(contactId),
      photoPath: Value(photoPath),
    );
  }

  factory ContactPhoto.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ContactPhoto(
      contactId: serializer.fromJson<String>(json['contactId']),
      photoPath: serializer.fromJson<String>(json['photoPath']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'contactId': serializer.toJson<String>(contactId),
      'photoPath': serializer.toJson<String>(photoPath),
    };
  }

  ContactPhoto copyWith({String? contactId, String? photoPath}) => ContactPhoto(
    contactId: contactId ?? this.contactId,
    photoPath: photoPath ?? this.photoPath,
  );
  ContactPhoto copyWithCompanion(ContactPhotosCompanion data) {
    return ContactPhoto(
      contactId: data.contactId.present ? data.contactId.value : this.contactId,
      photoPath: data.photoPath.present ? data.photoPath.value : this.photoPath,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ContactPhoto(')
          ..write('contactId: $contactId, ')
          ..write('photoPath: $photoPath')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(contactId, photoPath);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ContactPhoto &&
          other.contactId == this.contactId &&
          other.photoPath == this.photoPath);
}

class ContactPhotosCompanion extends UpdateCompanion<ContactPhoto> {
  final Value<String> contactId;
  final Value<String> photoPath;
  final Value<int> rowid;
  const ContactPhotosCompanion({
    this.contactId = const Value.absent(),
    this.photoPath = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ContactPhotosCompanion.insert({
    required String contactId,
    required String photoPath,
    this.rowid = const Value.absent(),
  }) : contactId = Value(contactId),
       photoPath = Value(photoPath);
  static Insertable<ContactPhoto> custom({
    Expression<String>? contactId,
    Expression<String>? photoPath,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (contactId != null) 'contact_id': contactId,
      if (photoPath != null) 'photo_path': photoPath,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ContactPhotosCompanion copyWith({
    Value<String>? contactId,
    Value<String>? photoPath,
    Value<int>? rowid,
  }) {
    return ContactPhotosCompanion(
      contactId: contactId ?? this.contactId,
      photoPath: photoPath ?? this.photoPath,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (contactId.present) {
      map['contact_id'] = Variable<String>(contactId.value);
    }
    if (photoPath.present) {
      map['photo_path'] = Variable<String>(photoPath.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ContactPhotosCompanion(')
          ..write('contactId: $contactId, ')
          ..write('photoPath: $photoPath, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $MedicationsTable extends Medications
    with TableInfo<$MedicationsTable, Medication> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MedicationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _photoPathMeta = const VerificationMeta(
    'photoPath',
  );
  @override
  late final GeneratedColumn<String> photoPath = GeneratedColumn<String>(
    'photo_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notificationIdMeta = const VerificationMeta(
    'notificationId',
  );
  @override
  late final GeneratedColumn<int> notificationId = GeneratedColumn<int>(
    'notification_id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, name, photoPath, notificationId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'medications';
  @override
  VerificationContext validateIntegrity(
    Insertable<Medication> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('photo_path')) {
      context.handle(
        _photoPathMeta,
        photoPath.isAcceptableOrUnknown(data['photo_path']!, _photoPathMeta),
      );
    }
    if (data.containsKey('notification_id')) {
      context.handle(
        _notificationIdMeta,
        notificationId.isAcceptableOrUnknown(
          data['notification_id']!,
          _notificationIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_notificationIdMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Medication map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Medication(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      photoPath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_path'],
      ),
      notificationId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}notification_id'],
      )!,
    );
  }

  @override
  $MedicationsTable createAlias(String alias) {
    return $MedicationsTable(attachedDatabase, alias);
  }
}

class Medication extends DataClass implements Insertable<Medication> {
  final int id;
  final String name;
  final String? photoPath;
  final int notificationId;
  const Medication({
    required this.id,
    required this.name,
    this.photoPath,
    required this.notificationId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || photoPath != null) {
      map['photo_path'] = Variable<String>(photoPath);
    }
    map['notification_id'] = Variable<int>(notificationId);
    return map;
  }

  MedicationsCompanion toCompanion(bool nullToAbsent) {
    return MedicationsCompanion(
      id: Value(id),
      name: Value(name),
      photoPath: photoPath == null && nullToAbsent
          ? const Value.absent()
          : Value(photoPath),
      notificationId: Value(notificationId),
    );
  }

  factory Medication.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Medication(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      photoPath: serializer.fromJson<String?>(json['photoPath']),
      notificationId: serializer.fromJson<int>(json['notificationId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'photoPath': serializer.toJson<String?>(photoPath),
      'notificationId': serializer.toJson<int>(notificationId),
    };
  }

  Medication copyWith({
    int? id,
    String? name,
    Value<String?> photoPath = const Value.absent(),
    int? notificationId,
  }) => Medication(
    id: id ?? this.id,
    name: name ?? this.name,
    photoPath: photoPath.present ? photoPath.value : this.photoPath,
    notificationId: notificationId ?? this.notificationId,
  );
  Medication copyWithCompanion(MedicationsCompanion data) {
    return Medication(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      photoPath: data.photoPath.present ? data.photoPath.value : this.photoPath,
      notificationId: data.notificationId.present
          ? data.notificationId.value
          : this.notificationId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Medication(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('photoPath: $photoPath, ')
          ..write('notificationId: $notificationId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, photoPath, notificationId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Medication &&
          other.id == this.id &&
          other.name == this.name &&
          other.photoPath == this.photoPath &&
          other.notificationId == this.notificationId);
}

class MedicationsCompanion extends UpdateCompanion<Medication> {
  final Value<int> id;
  final Value<String> name;
  final Value<String?> photoPath;
  final Value<int> notificationId;
  const MedicationsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.photoPath = const Value.absent(),
    this.notificationId = const Value.absent(),
  });
  MedicationsCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.photoPath = const Value.absent(),
    required int notificationId,
  }) : name = Value(name),
       notificationId = Value(notificationId);
  static Insertable<Medication> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? photoPath,
    Expression<int>? notificationId,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (photoPath != null) 'photo_path': photoPath,
      if (notificationId != null) 'notification_id': notificationId,
    });
  }

  MedicationsCompanion copyWith({
    Value<int>? id,
    Value<String>? name,
    Value<String?>? photoPath,
    Value<int>? notificationId,
  }) {
    return MedicationsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      photoPath: photoPath ?? this.photoPath,
      notificationId: notificationId ?? this.notificationId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (photoPath.present) {
      map['photo_path'] = Variable<String>(photoPath.value);
    }
    if (notificationId.present) {
      map['notification_id'] = Variable<int>(notificationId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MedicationsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('photoPath: $photoPath, ')
          ..write('notificationId: $notificationId')
          ..write(')'))
        .toString();
  }
}

class $MedicationTimesTable extends MedicationTimes
    with TableInfo<$MedicationTimesTable, MedicationTime> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MedicationTimesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _medicationIdMeta = const VerificationMeta(
    'medicationId',
  );
  @override
  late final GeneratedColumn<int> medicationId = GeneratedColumn<int>(
    'medication_id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _hourMeta = const VerificationMeta('hour');
  @override
  late final GeneratedColumn<int> hour = GeneratedColumn<int>(
    'hour',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _minuteMeta = const VerificationMeta('minute');
  @override
  late final GeneratedColumn<int> minute = GeneratedColumn<int>(
    'minute',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, medicationId, hour, minute];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'medication_times';
  @override
  VerificationContext validateIntegrity(
    Insertable<MedicationTime> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('medication_id')) {
      context.handle(
        _medicationIdMeta,
        medicationId.isAcceptableOrUnknown(
          data['medication_id']!,
          _medicationIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_medicationIdMeta);
    }
    if (data.containsKey('hour')) {
      context.handle(
        _hourMeta,
        hour.isAcceptableOrUnknown(data['hour']!, _hourMeta),
      );
    } else if (isInserting) {
      context.missing(_hourMeta);
    }
    if (data.containsKey('minute')) {
      context.handle(
        _minuteMeta,
        minute.isAcceptableOrUnknown(data['minute']!, _minuteMeta),
      );
    } else if (isInserting) {
      context.missing(_minuteMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  MedicationTime map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MedicationTime(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      medicationId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}medication_id'],
      )!,
      hour: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}hour'],
      )!,
      minute: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}minute'],
      )!,
    );
  }

  @override
  $MedicationTimesTable createAlias(String alias) {
    return $MedicationTimesTable(attachedDatabase, alias);
  }
}

class MedicationTime extends DataClass implements Insertable<MedicationTime> {
  final int id;
  final int medicationId;
  final int hour;
  final int minute;
  const MedicationTime({
    required this.id,
    required this.medicationId,
    required this.hour,
    required this.minute,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['medication_id'] = Variable<int>(medicationId);
    map['hour'] = Variable<int>(hour);
    map['minute'] = Variable<int>(minute);
    return map;
  }

  MedicationTimesCompanion toCompanion(bool nullToAbsent) {
    return MedicationTimesCompanion(
      id: Value(id),
      medicationId: Value(medicationId),
      hour: Value(hour),
      minute: Value(minute),
    );
  }

  factory MedicationTime.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MedicationTime(
      id: serializer.fromJson<int>(json['id']),
      medicationId: serializer.fromJson<int>(json['medicationId']),
      hour: serializer.fromJson<int>(json['hour']),
      minute: serializer.fromJson<int>(json['minute']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'medicationId': serializer.toJson<int>(medicationId),
      'hour': serializer.toJson<int>(hour),
      'minute': serializer.toJson<int>(minute),
    };
  }

  MedicationTime copyWith({
    int? id,
    int? medicationId,
    int? hour,
    int? minute,
  }) => MedicationTime(
    id: id ?? this.id,
    medicationId: medicationId ?? this.medicationId,
    hour: hour ?? this.hour,
    minute: minute ?? this.minute,
  );
  MedicationTime copyWithCompanion(MedicationTimesCompanion data) {
    return MedicationTime(
      id: data.id.present ? data.id.value : this.id,
      medicationId: data.medicationId.present
          ? data.medicationId.value
          : this.medicationId,
      hour: data.hour.present ? data.hour.value : this.hour,
      minute: data.minute.present ? data.minute.value : this.minute,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MedicationTime(')
          ..write('id: $id, ')
          ..write('medicationId: $medicationId, ')
          ..write('hour: $hour, ')
          ..write('minute: $minute')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, medicationId, hour, minute);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MedicationTime &&
          other.id == this.id &&
          other.medicationId == this.medicationId &&
          other.hour == this.hour &&
          other.minute == this.minute);
}

class MedicationTimesCompanion extends UpdateCompanion<MedicationTime> {
  final Value<int> id;
  final Value<int> medicationId;
  final Value<int> hour;
  final Value<int> minute;
  const MedicationTimesCompanion({
    this.id = const Value.absent(),
    this.medicationId = const Value.absent(),
    this.hour = const Value.absent(),
    this.minute = const Value.absent(),
  });
  MedicationTimesCompanion.insert({
    this.id = const Value.absent(),
    required int medicationId,
    required int hour,
    required int minute,
  }) : medicationId = Value(medicationId),
       hour = Value(hour),
       minute = Value(minute);
  static Insertable<MedicationTime> custom({
    Expression<int>? id,
    Expression<int>? medicationId,
    Expression<int>? hour,
    Expression<int>? minute,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (medicationId != null) 'medication_id': medicationId,
      if (hour != null) 'hour': hour,
      if (minute != null) 'minute': minute,
    });
  }

  MedicationTimesCompanion copyWith({
    Value<int>? id,
    Value<int>? medicationId,
    Value<int>? hour,
    Value<int>? minute,
  }) {
    return MedicationTimesCompanion(
      id: id ?? this.id,
      medicationId: medicationId ?? this.medicationId,
      hour: hour ?? this.hour,
      minute: minute ?? this.minute,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (medicationId.present) {
      map['medication_id'] = Variable<int>(medicationId.value);
    }
    if (hour.present) {
      map['hour'] = Variable<int>(hour.value);
    }
    if (minute.present) {
      map['minute'] = Variable<int>(minute.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MedicationTimesCompanion(')
          ..write('id: $id, ')
          ..write('medicationId: $medicationId, ')
          ..write('hour: $hour, ')
          ..write('minute: $minute')
          ..write(')'))
        .toString();
  }
}

class $AppointmentsTable extends Appointments
    with TableInfo<$AppointmentsTable, Appointment> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AppointmentsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _doctorNameMeta = const VerificationMeta(
    'doctorName',
  );
  @override
  late final GeneratedColumn<String> doctorName = GeneratedColumn<String>(
    'doctor_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _scheduledAtMeta = const VerificationMeta(
    'scheduledAt',
  );
  @override
  late final GeneratedColumn<DateTime> scheduledAt = GeneratedColumn<DateTime>(
    'scheduled_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _notificationIdMeta = const VerificationMeta(
    'notificationId',
  );
  @override
  late final GeneratedColumn<int> notificationId = GeneratedColumn<int>(
    'notification_id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    title,
    doctorName,
    scheduledAt,
    notificationId,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'appointments';
  @override
  VerificationContext validateIntegrity(
    Insertable<Appointment> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('doctor_name')) {
      context.handle(
        _doctorNameMeta,
        doctorName.isAcceptableOrUnknown(data['doctor_name']!, _doctorNameMeta),
      );
    } else if (isInserting) {
      context.missing(_doctorNameMeta);
    }
    if (data.containsKey('scheduled_at')) {
      context.handle(
        _scheduledAtMeta,
        scheduledAt.isAcceptableOrUnknown(
          data['scheduled_at']!,
          _scheduledAtMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_scheduledAtMeta);
    }
    if (data.containsKey('notification_id')) {
      context.handle(
        _notificationIdMeta,
        notificationId.isAcceptableOrUnknown(
          data['notification_id']!,
          _notificationIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_notificationIdMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Appointment map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Appointment(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      doctorName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}doctor_name'],
      )!,
      scheduledAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}scheduled_at'],
      )!,
      notificationId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}notification_id'],
      )!,
    );
  }

  @override
  $AppointmentsTable createAlias(String alias) {
    return $AppointmentsTable(attachedDatabase, alias);
  }
}

class Appointment extends DataClass implements Insertable<Appointment> {
  final int id;
  final String title;
  final String doctorName;
  final DateTime scheduledAt;
  final int notificationId;
  const Appointment({
    required this.id,
    required this.title,
    required this.doctorName,
    required this.scheduledAt,
    required this.notificationId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['title'] = Variable<String>(title);
    map['doctor_name'] = Variable<String>(doctorName);
    map['scheduled_at'] = Variable<DateTime>(scheduledAt);
    map['notification_id'] = Variable<int>(notificationId);
    return map;
  }

  AppointmentsCompanion toCompanion(bool nullToAbsent) {
    return AppointmentsCompanion(
      id: Value(id),
      title: Value(title),
      doctorName: Value(doctorName),
      scheduledAt: Value(scheduledAt),
      notificationId: Value(notificationId),
    );
  }

  factory Appointment.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Appointment(
      id: serializer.fromJson<int>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      doctorName: serializer.fromJson<String>(json['doctorName']),
      scheduledAt: serializer.fromJson<DateTime>(json['scheduledAt']),
      notificationId: serializer.fromJson<int>(json['notificationId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'title': serializer.toJson<String>(title),
      'doctorName': serializer.toJson<String>(doctorName),
      'scheduledAt': serializer.toJson<DateTime>(scheduledAt),
      'notificationId': serializer.toJson<int>(notificationId),
    };
  }

  Appointment copyWith({
    int? id,
    String? title,
    String? doctorName,
    DateTime? scheduledAt,
    int? notificationId,
  }) => Appointment(
    id: id ?? this.id,
    title: title ?? this.title,
    doctorName: doctorName ?? this.doctorName,
    scheduledAt: scheduledAt ?? this.scheduledAt,
    notificationId: notificationId ?? this.notificationId,
  );
  Appointment copyWithCompanion(AppointmentsCompanion data) {
    return Appointment(
      id: data.id.present ? data.id.value : this.id,
      title: data.title.present ? data.title.value : this.title,
      doctorName: data.doctorName.present
          ? data.doctorName.value
          : this.doctorName,
      scheduledAt: data.scheduledAt.present
          ? data.scheduledAt.value
          : this.scheduledAt,
      notificationId: data.notificationId.present
          ? data.notificationId.value
          : this.notificationId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Appointment(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('doctorName: $doctorName, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('notificationId: $notificationId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, title, doctorName, scheduledAt, notificationId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Appointment &&
          other.id == this.id &&
          other.title == this.title &&
          other.doctorName == this.doctorName &&
          other.scheduledAt == this.scheduledAt &&
          other.notificationId == this.notificationId);
}

class AppointmentsCompanion extends UpdateCompanion<Appointment> {
  final Value<int> id;
  final Value<String> title;
  final Value<String> doctorName;
  final Value<DateTime> scheduledAt;
  final Value<int> notificationId;
  const AppointmentsCompanion({
    this.id = const Value.absent(),
    this.title = const Value.absent(),
    this.doctorName = const Value.absent(),
    this.scheduledAt = const Value.absent(),
    this.notificationId = const Value.absent(),
  });
  AppointmentsCompanion.insert({
    this.id = const Value.absent(),
    required String title,
    required String doctorName,
    required DateTime scheduledAt,
    required int notificationId,
  }) : title = Value(title),
       doctorName = Value(doctorName),
       scheduledAt = Value(scheduledAt),
       notificationId = Value(notificationId);
  static Insertable<Appointment> custom({
    Expression<int>? id,
    Expression<String>? title,
    Expression<String>? doctorName,
    Expression<DateTime>? scheduledAt,
    Expression<int>? notificationId,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (doctorName != null) 'doctor_name': doctorName,
      if (scheduledAt != null) 'scheduled_at': scheduledAt,
      if (notificationId != null) 'notification_id': notificationId,
    });
  }

  AppointmentsCompanion copyWith({
    Value<int>? id,
    Value<String>? title,
    Value<String>? doctorName,
    Value<DateTime>? scheduledAt,
    Value<int>? notificationId,
  }) {
    return AppointmentsCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      doctorName: doctorName ?? this.doctorName,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      notificationId: notificationId ?? this.notificationId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (doctorName.present) {
      map['doctor_name'] = Variable<String>(doctorName.value);
    }
    if (scheduledAt.present) {
      map['scheduled_at'] = Variable<DateTime>(scheduledAt.value);
    }
    if (notificationId.present) {
      map['notification_id'] = Variable<int>(notificationId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AppointmentsCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('doctorName: $doctorName, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('notificationId: $notificationId')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $ContactPhotosTable contactPhotos = $ContactPhotosTable(this);
  late final $MedicationsTable medications = $MedicationsTable(this);
  late final $MedicationTimesTable medicationTimes = $MedicationTimesTable(
    this,
  );
  late final $AppointmentsTable appointments = $AppointmentsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    contactPhotos,
    medications,
    medicationTimes,
    appointments,
  ];
}

typedef $$ContactPhotosTableCreateCompanionBuilder =
    ContactPhotosCompanion Function({
      required String contactId,
      required String photoPath,
      Value<int> rowid,
    });
typedef $$ContactPhotosTableUpdateCompanionBuilder =
    ContactPhotosCompanion Function({
      Value<String> contactId,
      Value<String> photoPath,
      Value<int> rowid,
    });

class $$ContactPhotosTableFilterComposer
    extends Composer<_$AppDatabase, $ContactPhotosTable> {
  $$ContactPhotosTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get contactId => $composableBuilder(
    column: $table.contactId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoPath => $composableBuilder(
    column: $table.photoPath,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ContactPhotosTableOrderingComposer
    extends Composer<_$AppDatabase, $ContactPhotosTable> {
  $$ContactPhotosTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get contactId => $composableBuilder(
    column: $table.contactId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoPath => $composableBuilder(
    column: $table.photoPath,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ContactPhotosTableAnnotationComposer
    extends Composer<_$AppDatabase, $ContactPhotosTable> {
  $$ContactPhotosTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get contactId =>
      $composableBuilder(column: $table.contactId, builder: (column) => column);

  GeneratedColumn<String> get photoPath =>
      $composableBuilder(column: $table.photoPath, builder: (column) => column);
}

class $$ContactPhotosTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ContactPhotosTable,
          ContactPhoto,
          $$ContactPhotosTableFilterComposer,
          $$ContactPhotosTableOrderingComposer,
          $$ContactPhotosTableAnnotationComposer,
          $$ContactPhotosTableCreateCompanionBuilder,
          $$ContactPhotosTableUpdateCompanionBuilder,
          (
            ContactPhoto,
            BaseReferences<_$AppDatabase, $ContactPhotosTable, ContactPhoto>,
          ),
          ContactPhoto,
          PrefetchHooks Function()
        > {
  $$ContactPhotosTableTableManager(_$AppDatabase db, $ContactPhotosTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ContactPhotosTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ContactPhotosTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ContactPhotosTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> contactId = const Value.absent(),
                Value<String> photoPath = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ContactPhotosCompanion(
                contactId: contactId,
                photoPath: photoPath,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String contactId,
                required String photoPath,
                Value<int> rowid = const Value.absent(),
              }) => ContactPhotosCompanion.insert(
                contactId: contactId,
                photoPath: photoPath,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ContactPhotosTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ContactPhotosTable,
      ContactPhoto,
      $$ContactPhotosTableFilterComposer,
      $$ContactPhotosTableOrderingComposer,
      $$ContactPhotosTableAnnotationComposer,
      $$ContactPhotosTableCreateCompanionBuilder,
      $$ContactPhotosTableUpdateCompanionBuilder,
      (
        ContactPhoto,
        BaseReferences<_$AppDatabase, $ContactPhotosTable, ContactPhoto>,
      ),
      ContactPhoto,
      PrefetchHooks Function()
    >;
typedef $$MedicationsTableCreateCompanionBuilder =
    MedicationsCompanion Function({
      Value<int> id,
      required String name,
      Value<String?> photoPath,
      required int notificationId,
    });
typedef $$MedicationsTableUpdateCompanionBuilder =
    MedicationsCompanion Function({
      Value<int> id,
      Value<String> name,
      Value<String?> photoPath,
      Value<int> notificationId,
    });

class $$MedicationsTableFilterComposer
    extends Composer<_$AppDatabase, $MedicationsTable> {
  $$MedicationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoPath => $composableBuilder(
    column: $table.photoPath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get notificationId => $composableBuilder(
    column: $table.notificationId,
    builder: (column) => ColumnFilters(column),
  );
}

class $$MedicationsTableOrderingComposer
    extends Composer<_$AppDatabase, $MedicationsTable> {
  $$MedicationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoPath => $composableBuilder(
    column: $table.photoPath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get notificationId => $composableBuilder(
    column: $table.notificationId,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$MedicationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $MedicationsTable> {
  $$MedicationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get photoPath =>
      $composableBuilder(column: $table.photoPath, builder: (column) => column);

  GeneratedColumn<int> get notificationId => $composableBuilder(
    column: $table.notificationId,
    builder: (column) => column,
  );
}

class $$MedicationsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $MedicationsTable,
          Medication,
          $$MedicationsTableFilterComposer,
          $$MedicationsTableOrderingComposer,
          $$MedicationsTableAnnotationComposer,
          $$MedicationsTableCreateCompanionBuilder,
          $$MedicationsTableUpdateCompanionBuilder,
          (
            Medication,
            BaseReferences<_$AppDatabase, $MedicationsTable, Medication>,
          ),
          Medication,
          PrefetchHooks Function()
        > {
  $$MedicationsTableTableManager(_$AppDatabase db, $MedicationsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MedicationsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MedicationsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$MedicationsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String?> photoPath = const Value.absent(),
                Value<int> notificationId = const Value.absent(),
              }) => MedicationsCompanion(
                id: id,
                name: name,
                photoPath: photoPath,
                notificationId: notificationId,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String name,
                Value<String?> photoPath = const Value.absent(),
                required int notificationId,
              }) => MedicationsCompanion.insert(
                id: id,
                name: name,
                photoPath: photoPath,
                notificationId: notificationId,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$MedicationsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $MedicationsTable,
      Medication,
      $$MedicationsTableFilterComposer,
      $$MedicationsTableOrderingComposer,
      $$MedicationsTableAnnotationComposer,
      $$MedicationsTableCreateCompanionBuilder,
      $$MedicationsTableUpdateCompanionBuilder,
      (
        Medication,
        BaseReferences<_$AppDatabase, $MedicationsTable, Medication>,
      ),
      Medication,
      PrefetchHooks Function()
    >;
typedef $$MedicationTimesTableCreateCompanionBuilder =
    MedicationTimesCompanion Function({
      Value<int> id,
      required int medicationId,
      required int hour,
      required int minute,
    });
typedef $$MedicationTimesTableUpdateCompanionBuilder =
    MedicationTimesCompanion Function({
      Value<int> id,
      Value<int> medicationId,
      Value<int> hour,
      Value<int> minute,
    });

class $$MedicationTimesTableFilterComposer
    extends Composer<_$AppDatabase, $MedicationTimesTable> {
  $$MedicationTimesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get medicationId => $composableBuilder(
    column: $table.medicationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get hour => $composableBuilder(
    column: $table.hour,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get minute => $composableBuilder(
    column: $table.minute,
    builder: (column) => ColumnFilters(column),
  );
}

class $$MedicationTimesTableOrderingComposer
    extends Composer<_$AppDatabase, $MedicationTimesTable> {
  $$MedicationTimesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get medicationId => $composableBuilder(
    column: $table.medicationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get hour => $composableBuilder(
    column: $table.hour,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get minute => $composableBuilder(
    column: $table.minute,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$MedicationTimesTableAnnotationComposer
    extends Composer<_$AppDatabase, $MedicationTimesTable> {
  $$MedicationTimesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get medicationId => $composableBuilder(
    column: $table.medicationId,
    builder: (column) => column,
  );

  GeneratedColumn<int> get hour =>
      $composableBuilder(column: $table.hour, builder: (column) => column);

  GeneratedColumn<int> get minute =>
      $composableBuilder(column: $table.minute, builder: (column) => column);
}

class $$MedicationTimesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $MedicationTimesTable,
          MedicationTime,
          $$MedicationTimesTableFilterComposer,
          $$MedicationTimesTableOrderingComposer,
          $$MedicationTimesTableAnnotationComposer,
          $$MedicationTimesTableCreateCompanionBuilder,
          $$MedicationTimesTableUpdateCompanionBuilder,
          (
            MedicationTime,
            BaseReferences<
              _$AppDatabase,
              $MedicationTimesTable,
              MedicationTime
            >,
          ),
          MedicationTime,
          PrefetchHooks Function()
        > {
  $$MedicationTimesTableTableManager(
    _$AppDatabase db,
    $MedicationTimesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MedicationTimesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MedicationTimesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$MedicationTimesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<int> medicationId = const Value.absent(),
                Value<int> hour = const Value.absent(),
                Value<int> minute = const Value.absent(),
              }) => MedicationTimesCompanion(
                id: id,
                medicationId: medicationId,
                hour: hour,
                minute: minute,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required int medicationId,
                required int hour,
                required int minute,
              }) => MedicationTimesCompanion.insert(
                id: id,
                medicationId: medicationId,
                hour: hour,
                minute: minute,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$MedicationTimesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $MedicationTimesTable,
      MedicationTime,
      $$MedicationTimesTableFilterComposer,
      $$MedicationTimesTableOrderingComposer,
      $$MedicationTimesTableAnnotationComposer,
      $$MedicationTimesTableCreateCompanionBuilder,
      $$MedicationTimesTableUpdateCompanionBuilder,
      (
        MedicationTime,
        BaseReferences<_$AppDatabase, $MedicationTimesTable, MedicationTime>,
      ),
      MedicationTime,
      PrefetchHooks Function()
    >;
typedef $$AppointmentsTableCreateCompanionBuilder =
    AppointmentsCompanion Function({
      Value<int> id,
      required String title,
      required String doctorName,
      required DateTime scheduledAt,
      required int notificationId,
    });
typedef $$AppointmentsTableUpdateCompanionBuilder =
    AppointmentsCompanion Function({
      Value<int> id,
      Value<String> title,
      Value<String> doctorName,
      Value<DateTime> scheduledAt,
      Value<int> notificationId,
    });

class $$AppointmentsTableFilterComposer
    extends Composer<_$AppDatabase, $AppointmentsTable> {
  $$AppointmentsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get doctorName => $composableBuilder(
    column: $table.doctorName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get scheduledAt => $composableBuilder(
    column: $table.scheduledAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get notificationId => $composableBuilder(
    column: $table.notificationId,
    builder: (column) => ColumnFilters(column),
  );
}

class $$AppointmentsTableOrderingComposer
    extends Composer<_$AppDatabase, $AppointmentsTable> {
  $$AppointmentsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get doctorName => $composableBuilder(
    column: $table.doctorName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get scheduledAt => $composableBuilder(
    column: $table.scheduledAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get notificationId => $composableBuilder(
    column: $table.notificationId,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$AppointmentsTableAnnotationComposer
    extends Composer<_$AppDatabase, $AppointmentsTable> {
  $$AppointmentsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get doctorName => $composableBuilder(
    column: $table.doctorName,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get scheduledAt => $composableBuilder(
    column: $table.scheduledAt,
    builder: (column) => column,
  );

  GeneratedColumn<int> get notificationId => $composableBuilder(
    column: $table.notificationId,
    builder: (column) => column,
  );
}

class $$AppointmentsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $AppointmentsTable,
          Appointment,
          $$AppointmentsTableFilterComposer,
          $$AppointmentsTableOrderingComposer,
          $$AppointmentsTableAnnotationComposer,
          $$AppointmentsTableCreateCompanionBuilder,
          $$AppointmentsTableUpdateCompanionBuilder,
          (
            Appointment,
            BaseReferences<_$AppDatabase, $AppointmentsTable, Appointment>,
          ),
          Appointment,
          PrefetchHooks Function()
        > {
  $$AppointmentsTableTableManager(_$AppDatabase db, $AppointmentsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AppointmentsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AppointmentsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AppointmentsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<String> doctorName = const Value.absent(),
                Value<DateTime> scheduledAt = const Value.absent(),
                Value<int> notificationId = const Value.absent(),
              }) => AppointmentsCompanion(
                id: id,
                title: title,
                doctorName: doctorName,
                scheduledAt: scheduledAt,
                notificationId: notificationId,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String title,
                required String doctorName,
                required DateTime scheduledAt,
                required int notificationId,
              }) => AppointmentsCompanion.insert(
                id: id,
                title: title,
                doctorName: doctorName,
                scheduledAt: scheduledAt,
                notificationId: notificationId,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$AppointmentsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $AppointmentsTable,
      Appointment,
      $$AppointmentsTableFilterComposer,
      $$AppointmentsTableOrderingComposer,
      $$AppointmentsTableAnnotationComposer,
      $$AppointmentsTableCreateCompanionBuilder,
      $$AppointmentsTableUpdateCompanionBuilder,
      (
        Appointment,
        BaseReferences<_$AppDatabase, $AppointmentsTable, Appointment>,
      ),
      Appointment,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$ContactPhotosTableTableManager get contactPhotos =>
      $$ContactPhotosTableTableManager(_db, _db.contactPhotos);
  $$MedicationsTableTableManager get medications =>
      $$MedicationsTableTableManager(_db, _db.medications);
  $$MedicationTimesTableTableManager get medicationTimes =>
      $$MedicationTimesTableTableManager(_db, _db.medicationTimes);
  $$AppointmentsTableTableManager get appointments =>
      $$AppointmentsTableTableManager(_db, _db.appointments);
}
