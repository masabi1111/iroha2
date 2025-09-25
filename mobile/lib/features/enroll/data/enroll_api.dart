import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

enum EnrollmentStatus {
  pending,
  active,
  waitlisted,
  cancelled,
  completed,
}

extension on EnrollmentStatus {
  String get value => name;
}

EnrollmentStatus _parseEnrollmentStatus(String? value) {
  if (value == null) {
    return EnrollmentStatus.pending;
  }
  final normalized = value.toLowerCase();
  for (final status in EnrollmentStatus.values) {
    if (status.value == normalized) {
      return status;
    }
  }
  return EnrollmentStatus.pending;
}

class EnrollmentResult {
  const EnrollmentResult({required this.enrollmentId, required this.status});

  factory EnrollmentResult.fromJson(Map<String, dynamic> json) {
    final dynamic rawId = json['enrollmentId'] ?? json['enrollment_id'];
    final enrollmentId = rawId == null ? '' : '$rawId';
    return EnrollmentResult(
      enrollmentId: enrollmentId,
      status: _parseEnrollmentStatus(json['status'] as String?),
    );
  }

  final String enrollmentId;
  final EnrollmentStatus status;
}

class EnrollApi {
  const EnrollApi(this._dio);

  final Dio _dio;

  Future<EnrollmentResult> createEnrollment({
    required String courseId,
    String? sectionId,
  }) async {
    final payload = <String, dynamic>{
      'courseId': int.tryParse(courseId) ?? courseId,
    };
    if (sectionId != null && sectionId.isNotEmpty) {
      payload['sectionId'] = int.tryParse(sectionId) ?? sectionId;
    }

    final response = await _dio.post<Map<String, dynamic>>(
      '/enrollments',
      data: payload,
    );
    final data = response.data ?? <String, dynamic>{};
    return EnrollmentResult.fromJson(data);
  }
}

final enrollApiProvider = Provider<EnrollApi>((ref) {
  final dio = ref.watch(dioProvider);
  return EnrollApi(dio);
});
