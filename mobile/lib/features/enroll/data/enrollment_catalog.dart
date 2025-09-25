import 'dart:async';
import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

@immutable
class EnrollmentSection {
  const EnrollmentSection({
    required this.id,
    required this.title,
    this.schedule,
  });

  final int id;
  final String title;
  final String? schedule;
}

@immutable
class EnrollmentCourseDetail {
  EnrollmentCourseDetail({
    required this.id,
    required this.title,
    required this.description,
    required List<EnrollmentSection> sections,
  }) : sections = UnmodifiableListView<EnrollmentSection>(sections);

  final int id;
  final String title;
  final String description;
  final UnmodifiableListView<EnrollmentSection> sections;
}

abstract class EnrollmentCatalogDataSource {
  Future<EnrollmentCourseDetail> fetchCourse(int courseId);
}

final enrollmentCatalogDataSourceProvider =
    Provider<EnrollmentCatalogDataSource>((ref) {
  return const MockEnrollmentCatalogDataSource();
});

final enrollmentCourseDetailProvider =
    FutureProvider.family<EnrollmentCourseDetail, int>((ref, courseId) async {
  final dataSource = ref.watch(enrollmentCatalogDataSourceProvider);
  return dataSource.fetchCourse(courseId);
});

class MockEnrollmentCatalogDataSource implements EnrollmentCatalogDataSource {
  const MockEnrollmentCatalogDataSource();

  @override
  Future<EnrollmentCourseDetail> fetchCourse(int courseId) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));

    final detail = _mockCourses[courseId];
    if (detail != null) {
      return detail;
    }

    return EnrollmentCourseDetail(
      id: courseId,
      title: 'Course #$courseId',
      description:
          'Details for course #$courseId are not available. This is placeholder content.',
      sections: const <EnrollmentSection>[],
    );
  }
}

final Map<int, EnrollmentCourseDetail> _mockCourses = <int, EnrollmentCourseDetail>{
  101: EnrollmentCourseDetail(
    id: 101,
    title: 'A1 Conversation Basics',
    description:
        'Practice introductory Japanese conversation with weekly live sessions and homework reviews.',
    sections: <EnrollmentSection>[
      EnrollmentSection(
        id: 1,
        title: 'Evening Cohort',
        schedule: 'Sun & Tue · 19:00 - 20:30',
      ),
      EnrollmentSection(
        id: 2,
        title: 'Weekend Cohort',
        schedule: 'Sat · 10:00 - 12:30',
      ),
    ],
  ),
  202: EnrollmentCourseDetail(
    id: 202,
    title: 'Kanji Bootcamp',
    description:
        'Intensive kanji recognition drills focused on JLPT N4 characters with instructor feedback.',
    sections: <EnrollmentSection>[
      EnrollmentSection(
        id: 9,
        title: 'Hybrid Section',
        schedule: 'Thu · 20:00 - 21:30 (online)',
      ),
    ],
  ),
};
