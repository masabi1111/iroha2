import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

@immutable
class EnrollmentResult {
  const EnrollmentResult({
    required this.enrollmentId,
    required this.status,
    required this.seatsLeft,
  });

  final String enrollmentId;
  final EnrollmentStatus status;
  final int seatsLeft;
}

enum EnrollmentStatus {
  pending,
  waitlisted,
}

final enrollApiProvider = Provider<EnrollApi>((ref) {
  final dio = ref.watch(dioProvider);
  return EnrollApi(dio);
});

class EnrollApi {
  EnrollApi(this._dio);

  final Dio _dio;

  Future<EnrollmentResult> enroll({
    required int courseId,
    int? sectionId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/enrollments',
      data: <String, dynamic>{
        'courseId': courseId,
        if (sectionId != null) 'sectionId': sectionId,
      },
    );

    final data = response.data ?? <String, dynamic>{};
    final enrollmentId = data['enrollmentId'] as String?;
    final status = data['status'] as String?;
    final seatsLeft = data['seatsLeft'] as int?;

    if (enrollmentId == null || status == null || seatsLeft == null) {
      throw DioException(
        requestOptions: response.requestOptions,
        message: 'Invalid enrollment response.',
      );
    }

    final normalizedStatus = EnrollmentStatus.values.firstWhere(
      (value) => value.name == status,
      orElse: () => throw DioException(
        requestOptions: response.requestOptions,
        message: 'Unknown enrollment status "$status".',
      ),
    );

    return EnrollmentResult(
      enrollmentId: enrollmentId,
      status: normalizedStatus,
      seatsLeft: seatsLeft,
    );
  }
}
