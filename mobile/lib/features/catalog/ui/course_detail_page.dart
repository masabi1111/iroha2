import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../l10n/app_localizations.dart';
import '../logic/catalog_providers.dart';
import '../models/catalog_models.dart';

class CourseDetailPage extends ConsumerWidget {
  const CourseDetailPage({required this.courseId, super.key});

  final String courseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courseValue = ref.watch(courseDetailProvider(courseId));
    final sectionsValue = ref.watch(sectionsByCourseProvider(courseId));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.courseDetailsTitle),
      ),
      body: SafeArea(
        child: courseValue.when(
          data: (course) => RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(courseDetailProvider(courseId));
              ref.invalidate(sectionsByCourseProvider(courseId));
              await Future.wait([
                ref.read(courseDetailProvider(courseId).future),
                ref.read(sectionsByCourseProvider(courseId).future),
              ]);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                _CourseOverviewContent(course: course),
                const SizedBox(height: 24),
                _SectionsContent(
                  courseId: courseId,
                  sectionsValue: sectionsValue,
                ),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.center,
                  child: FilledButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/enroll/$courseId');
                    },
                    child: Text(l10n.enroll),
                  ),
                ),
              ],
            ),
          ),
          error: (error, _) => _ErrorState(
            message: l10n.errorMessage,
            onRetry: () {
              ref.invalidate(courseDetailProvider(courseId));
            },
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }
}

class _CourseOverviewContent extends StatelessWidget {
  const _CourseOverviewContent({required this.course});

  final CourseDetail course;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = Localizations.localeOf(context).toLanguageTag();
    final price = course.priceCents != null
        ? (course.currency != null && course.currency!.isNotEmpty
            ? NumberFormat.simpleCurrency(name: course.currency, locale: locale)
            : NumberFormat.simpleCurrency(locale: locale))
            .format(course.priceCents! / 100)
        : null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(course.title, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(course.code, style: theme.textTheme.bodyMedium),
            if (course.level != null) ...[
              const SizedBox(height: 8),
              Text(course.level!, style: theme.textTheme.bodyMedium),
            ],
            if (price != null) ...[
              const SizedBox(height: 8),
              Text(price, style: theme.textTheme.titleMedium),
            ],
            if (course.description != null && course.description!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(course.description!, style: theme.textTheme.bodyMedium),
            ],
            if (course.language != null || course.modality != null) ...[
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  if (course.language != null)
                    Chip(
                      avatar: const Icon(Icons.language, size: 18),
                      label: Text(course.language!),
                    ),
                  if (course.modality != null)
                    Chip(
                      avatar: const Icon(Icons.cast_for_education, size: 18),
                      label: Text(course.modality!),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionsContent extends ConsumerWidget {
  const _SectionsContent({required this.courseId, required this.sectionsValue});

  final String courseId;
  final AsyncValue<List<SectionSummary>> sectionsValue;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    return sectionsValue.when(
      data: (sections) {
        if (sections.isEmpty) {
          return _EmptyState(message: l10n.noSectionsMessage);
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.sectionsTitle, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            for (final section in sections)
              _SectionTile(
                key: ValueKey(section.id),
                section: section,
              ),
          ],
        );
      },
      error: (error, _) => _ErrorState(
        message: l10n.errorMessage,
        onRetry: () {
          ref.invalidate(sectionsByCourseProvider(courseId));
        },
      ),
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  const _SectionTile({super.key, required this.section});

  final SectionSummary section;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subtitle = _buildSubtitle(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: _WeekdayAvatar(weekday: section.weekday),
        title: Text(section.title ?? context.l10n.sectionFallbackTitle(section.id)),
        subtitle: subtitle != null ? Text(subtitle) : null,
        trailing: section.instructorName != null
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    section.instructorName!,
                    style: theme.textTheme.bodyMedium,
                  ),
                  Text(
                    context.l10n.instructorLabel,
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              )
            : null,
      ),
    );
  }

  String? _buildSubtitle(BuildContext context) {
    final start = section.startTimeOfDay;
    final end = section.endTimeOfDay;
    if (start == null && end == null) {
      return null;
    }
    final materialLocalizations = MaterialLocalizations.of(context);
    if (start != null && end != null) {
      return '${materialLocalizations.formatTimeOfDay(start)} - ${materialLocalizations.formatTimeOfDay(end)}';
    }
    if (start != null) {
      return materialLocalizations.formatTimeOfDay(start);
    }
    return materialLocalizations.formatTimeOfDay(end!);
  }
}

class _WeekdayAvatar extends StatelessWidget {
  const _WeekdayAvatar({this.weekday});

  final int? weekday;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = _weekdayLabel(context);
    return CircleAvatar(
      backgroundColor: theme.colorScheme.primaryContainer,
      child: Text(
        label,
        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onPrimaryContainer),
      ),
    );
  }

  String _weekdayLabel(BuildContext context) {
    if (weekday == null) {
      return '--';
    }
    final normalized = ((weekday! % 7) + 7) % 7;
    final baseDate = DateTime(2024, 1, 1 + normalized);
    final locale = Localizations.localeOf(context).toLanguageTag();
    return DateFormat.E(locale).format(baseDate).substring(0, 3).toUpperCase();
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: Text(
          message,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: onRetry,
              child: Text(l10n.retry),
            ),
          ],
        ),
      ),
    );
  }
}
