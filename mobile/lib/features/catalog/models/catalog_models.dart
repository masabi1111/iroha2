import 'package:flutter/material.dart';

T? _readValue<T>(Map<String, dynamic> json, String key) {
  final dynamic camelValue = json[key];
  if (camelValue is T) {
    return camelValue;
  }
  final snakeKey = key.replaceAllMapped(
    RegExp('[A-Z]'),
    (match) => '_${match.group(0)!.toLowerCase()}',
  );
  final dynamic snakeValue = json[snakeKey];
  if (snakeValue is T) {
    return snakeValue;
  }
  return null;
}

DateTime? _parseDateTime(Map<String, dynamic> json, String key) {
  final value = _readValue<String>(json, key);
  if (value == null || value.isEmpty) {
    return null;
  }
  return DateTime.tryParse(value);
}

class SeasonSummary {
  const SeasonSummary({
    required this.code,
    required this.title,
    this.status,
    this.startDate,
    this.endDate,
  });

  factory SeasonSummary.fromJson(Map<String, dynamic> json) {
    return SeasonSummary(
      code: _readValue<String>(json, 'code') ?? '',
      title: _readValue<String>(json, 'title') ?? '',
      status: _readValue<String>(json, 'status'),
      startDate: _parseDateTime(json, 'startDate'),
      endDate: _parseDateTime(json, 'endDate'),
    );
  }

  final String code;
  final String title;
  final String? status;
  final DateTime? startDate;
  final DateTime? endDate;
}

class CourseSummary {
  const CourseSummary({
    required this.id,
    required this.code,
    required this.title,
    this.level,
    this.priceCents,
    this.currency,
    this.seatsLeft,
  });

  factory CourseSummary.fromJson(Map<String, dynamic> json) {
    return CourseSummary(
      id: '${_readValue<dynamic>(json, 'id') ?? ''}',
      code: _readValue<String>(json, 'code') ?? '',
      title: _readValue<String>(json, 'title') ?? '',
      level: _readValue<String>(json, 'level'),
      priceCents: _readValue<num>(json, 'priceCents')?.toInt(),
      currency: _readValue<String>(json, 'currency'),
      seatsLeft: _readValue<num>(json, 'seatsLeft')?.toInt(),
    );
  }

  final String id;
  final String code;
  final String title;
  final String? level;
  final int? priceCents;
  final String? currency;
  final int? seatsLeft;
}

class CourseDetail extends CourseSummary {
  const CourseDetail({
    required super.id,
    required super.code,
    required super.title,
    super.level,
    super.priceCents,
    super.currency,
    super.seatsLeft,
    this.description,
    this.language,
    this.modality,
  });

  factory CourseDetail.fromJson(Map<String, dynamic> json) {
    return CourseDetail(
      id: '${_readValue<dynamic>(json, 'id') ?? ''}',
      code: _readValue<String>(json, 'code') ?? '',
      title: _readValue<String>(json, 'title') ?? '',
      level: _readValue<String>(json, 'level'),
      priceCents: _readValue<num>(json, 'priceCents')?.toInt(),
      currency: _readValue<String>(json, 'currency'),
      seatsLeft: _readValue<num>(json, 'seatsLeft')?.toInt(),
      description: _readValue<String>(json, 'description'),
      language: _readValue<String>(json, 'language'),
      modality: _readValue<String>(json, 'modality'),
    );
  }

  final String? description;
  final String? language;
  final String? modality;
}

class SectionSummary {
  const SectionSummary({
    required this.id,
    this.title,
    this.weekday,
    this.startTime,
    this.endTime,
    this.instructorName,
  });

  factory SectionSummary.fromJson(Map<String, dynamic> json) {
    final instructor = _readValue<Map<String, dynamic>>(json, 'instructor');
    String? instructorName;
    if (instructor != null) {
      final firstName =
          _readValue<String>(instructor, 'firstName') ?? _readValue<String>(instructor, 'first_name');
      final lastName =
          _readValue<String>(instructor, 'lastName') ?? _readValue<String>(instructor, 'last_name');
      final parts = <String>[
        if (firstName != null && firstName.isNotEmpty) firstName,
        if (lastName != null && lastName.isNotEmpty) lastName,
      ];
      instructorName = parts.join(' ');
      if (instructorName.isEmpty) {
        instructorName = _readValue<String>(instructor, 'email');
      }
    }

    return SectionSummary(
      id: '${_readValue<dynamic>(json, 'id') ?? ''}',
      title: _readValue<String>(json, 'title'),
      weekday: _readValue<num>(json, 'weekday')?.toInt(),
      startTime: _readValue<String>(json, 'startTime') ?? _readValue<String>(json, 'start_time'),
      endTime: _readValue<String>(json, 'endTime') ?? _readValue<String>(json, 'end_time'),
      instructorName: instructorName,
    );
  }

  final String id;
  final String? title;
  final int? weekday;
  final String? startTime;
  final String? endTime;
  final String? instructorName;

  TimeOfDay? get startTimeOfDay => _parseTimeOfDay(startTime);
  TimeOfDay? get endTimeOfDay => _parseTimeOfDay(endTime);
}

TimeOfDay? _parseTimeOfDay(String? value) {
  if (value == null || value.isEmpty) {
    return null;
  }
  final parts = value.split(':');
  if (parts.length < 2) {
    return null;
  }
  final hour = int.tryParse(parts[0]);
  final minute = int.tryParse(parts[1]);
  if (hour == null || minute == null) {
    return null;
  }
  return TimeOfDay(hour: hour, minute: minute);
}
