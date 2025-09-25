import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../l10n/app_localizations.dart';
import '../logic/catalog_providers.dart';
import '../models/catalog_models.dart';

class SeasonDetailPage extends ConsumerWidget {
  const SeasonDetailPage({required this.seasonCode, super.key});

  final String seasonCode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesValue = ref.watch(coursesBySeasonProvider(seasonCode));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text('${l10n.coursesTitle} • $seasonCode'),
      ),
      body: coursesValue.when(
        data: (courses) {
          if (courses.isEmpty) {
            return _EmptyState(message: l10n.noCoursesMessage);
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(coursesBySeasonProvider(seasonCode));
              await ref.read(coursesBySeasonProvider(seasonCode).future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final course = courses[index];
                return _CourseCard(course: course);
              },
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemCount: courses.length,
            ),
          );
        },
        error: (error, _) => _ErrorState(
          message: l10n.errorMessage,
          onRetry: () {
            ref.invalidate(coursesBySeasonProvider(seasonCode));
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course});

  final CourseSummary course;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(course.title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(course.code, style: theme.textTheme.bodySmall),
            if (course.level != null) ...[
              const SizedBox(height: 8),
              Text(course.level!, style: theme.textTheme.bodyMedium),
            ],
            if (course.priceCents != null || course.seatsLeft != null) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (course.priceCents != null)
                    _InfoChip(
                      icon: Icons.payments_outlined,
                      label: _formatPrice(context, course.priceCents!, course.currency),
                    ),
                  if (course.seatsLeft != null)
                    _InfoChip(
                      icon: Icons.event_seat_outlined,
                      label: l10n.seatsLeft(course.seatsLeft!),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: () {
                  Navigator.of(context).pushNamed('/courses/${course.id}');
                },
                child: Text(l10n.viewCourse),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(BuildContext context, int priceCents, String? currency) {
    final locale = Localizations.localeOf(context).toLanguageTag();
    final formatter = currency != null && currency.isNotEmpty
        ? NumberFormat.simpleCurrency(name: currency, locale: locale)
        : NumberFormat.simpleCurrency(locale: locale);
    return formatter.format(priceCents / 100);
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
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
