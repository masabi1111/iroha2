import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../models/catalog_models.dart';

enum SeasonFilterStatus { enrolling, running }

extension on SeasonFilterStatus {
  String get value {
    switch (this) {
      case SeasonFilterStatus.enrolling:
        return 'enrolling';
      case SeasonFilterStatus.running:
        return 'running';
    }
  }
}

class CatalogApi {
  const CatalogApi(this._dio);

  final Dio _dio;

  Future<List<SeasonSummary>> fetchSeasons(SeasonFilterStatus status) async {
    final response = await _dio.get<List<dynamic>>(
      '/seasons',
      queryParameters: {'status': status.value},
      options: Options(extra: const <String, dynamic>{'skipAuth': true}),
    );
    final data = response.data ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(SeasonSummary.fromJson)
        .where((season) => season.code.isNotEmpty)
        .toList();
  }

  Future<List<CourseSummary>> fetchCourses({
    required String seasonCode,
    int page = 0,
    int size = 25,
  }) async {
    final response = await _dio.get<List<dynamic>>(
      '/courses',
      queryParameters: {
        'season': seasonCode,
        'published': true,
        'page': page,
        'size': size,
      },
      options: Options(extra: const <String, dynamic>{'skipAuth': true}),
    );
    final data = response.data ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(CourseSummary.fromJson)
        .where((course) => course.id.isNotEmpty)
        .toList();
  }

  Future<CourseDetail> fetchCourseDetail(String courseId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/courses/$courseId',
      options: Options(extra: const <String, dynamic>{'skipAuth': true}),
    );
    final data = response.data ?? <String, dynamic>{};
    return CourseDetail.fromJson(data);
  }

  Future<List<SectionSummary>> fetchSections(String courseId) async {
    final response = await _dio.get<List<dynamic>>(
      '/sections',
      queryParameters: {'courseId': courseId},
      options: Options(extra: const <String, dynamic>{'skipAuth': true}),
    );
    final data = response.data ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(SectionSummary.fromJson)
        .where((section) => section.id.isNotEmpty)
        .toList();
  }
}

final catalogApiProvider = Provider<CatalogApi>((ref) {
  final dio = ref.watch(dioProvider);
  return CatalogApi(dio);
});
