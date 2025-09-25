import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/catalog_api.dart';
import '../models/catalog_models.dart';

final seasonsProvider = FutureProvider<List<SeasonSummary>>((ref) async {
  final api = ref.watch(catalogApiProvider);
  final enrolling = await api.fetchSeasons(SeasonFilterStatus.enrolling);
  final running = await api.fetchSeasons(SeasonFilterStatus.running);
  final seen = <String>{};
  final results = <SeasonSummary>[];
  for (final season in [...enrolling, ...running]) {
    if (seen.add(season.code)) {
      results.add(season);
    }
  }
  results.sort(
    (a, b) => (a.startDate ?? DateTime.fromMillisecondsSinceEpoch(0))
        .compareTo(b.startDate ?? DateTime.fromMillisecondsSinceEpoch(0)),
  );
  return results;
});

final coursesBySeasonProvider = FutureProvider.family<List<CourseSummary>, String>((ref, code) async {
  final api = ref.watch(catalogApiProvider);
  return api.fetchCourses(seasonCode: code);
});

final courseDetailProvider = FutureProvider.family<CourseDetail, String>((ref, id) async {
  final api = ref.watch(catalogApiProvider);
  return api.fetchCourseDetail(id);
});

final sectionsByCourseProvider = FutureProvider.family<List<SectionSummary>, String>((ref, id) async {
  final api = ref.watch(catalogApiProvider);
  return api.fetchSections(id);
});
