import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/app_localizations.dart';
import '../../catalog/logic/catalog_providers.dart';
import '../../catalog/models/catalog_models.dart';
import '../data/enroll_api.dart';

class EnrollPage extends ConsumerStatefulWidget {
  const EnrollPage({required this.courseId, super.key});

  final String courseId;

  @override
  ConsumerState<EnrollPage> createState() => _EnrollPageState();
}

class _EnrollPageState extends ConsumerState<EnrollPage> {
  String? _selectedSectionId;
  bool _isSubmitting = false;

  Future<void> _submit() async {
    final l10n = context.l10n;
    final sectionsValue = ref.read(sectionsByCourseProvider(widget.courseId));
    final requiresSelection = sectionsValue.maybeWhen(
      data: (sections) => sections.isNotEmpty,
      orElse: () => false,
    );

    if (requiresSelection && (_selectedSectionId == null || _selectedSectionId!.isEmpty)) {
      _showSnackBar(l10n.enrollmentSectionRequired);
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmitting = true;
    });

    try {
      final api = ref.read(enrollApiProvider);
      final result = await api.createEnrollment(
        courseId: widget.courseId,
        sectionId: _selectedSectionId,
      );

      if (!mounted) {
        return;
      }

      switch (result.status) {
        case EnrollmentStatus.waitlisted:
          _showSnackBar(l10n.enrollmentWaitlistedMessage);
          await Future<void>.delayed(const Duration(milliseconds: 350));
          if (!mounted) {
            return;
          }
          Navigator.of(context).pushNamedAndRemoveUntil(
            '/dashboard',
            (route) => route.settings.name == '/' || route.isFirst,
          );
          break;
        case EnrollmentStatus.pending:
          if (result.enrollmentId.isEmpty) {
            _showSnackBar(l10n.errorMessage);
            return;
          }
          Navigator.of(context).pushReplacementNamed('/checkout/${result.enrollmentId}');
          break;
        case EnrollmentStatus.active:
        case EnrollmentStatus.completed:
          _showSnackBar(l10n.enrollmentSuccessMessage);
          await Future<void>.delayed(const Duration(milliseconds: 350));
          if (!mounted) {
            return;
          }
          Navigator.of(context).pushNamedAndRemoveUntil(
            '/dashboard',
            (route) => route.settings.name == '/' || route.isFirst,
          );
          break;
        case EnrollmentStatus.cancelled:
          _showSnackBar(l10n.errorMessage);
          break;
      }
    } on DioException catch (error) {
      final message = _extractErrorMessage(error) ?? context.l10n.errorMessage;
      _showSnackBar(message);
    } catch (_) {
      _showSnackBar(context.l10n.errorMessage);
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message)),
      );
  }

  String? _extractErrorMessage(DioException error) {
    final response = error.response;
    if (response == null) {
      return null;
    }
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    } else if (data is String && data.isNotEmpty) {
      return data;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final courseValue = ref.watch(courseDetailProvider(widget.courseId));
    final sectionsValue = ref.watch(sectionsByCourseProvider(widget.courseId));

    final canSubmit = !_isSubmitting &&
        sectionsValue.maybeWhen(
          data: (sections) => sections.isEmpty || _selectedSectionId != null,
          orElse: () => false,
        );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.enroll)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(courseDetailProvider(widget.courseId));
            ref.invalidate(sectionsByCourseProvider(widget.courseId));
            await Future.wait([
              ref.read(courseDetailProvider(widget.courseId).future),
              ref.read(sectionsByCourseProvider(widget.courseId).future),
            ]);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              _CourseSummaryCard(
                value: courseValue,
                onRetry: () {
                  ref.invalidate(courseDetailProvider(widget.courseId));
                },
              ),
              const SizedBox(height: 24),
              _SectionSelector(
                value: sectionsValue,
                selectedSectionId: _selectedSectionId,
                onChanged: (value) {
                  setState(() {
                    _selectedSectionId = value;
                  });
                },
                onRetry: () {
                  ref.invalidate(sectionsByCourseProvider(widget.courseId));
                },
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: canSubmit ? _submit : null,
                child: _isSubmitting
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Theme.of(context).colorScheme.onPrimary,
                        ),
                      )
                    : Text(l10n.enroll),
              ),
              if (_isSubmitting)
                const Padding(
                  padding: EdgeInsets.only(top: 16),
                  child: LinearProgressIndicator(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CourseSummaryCard extends StatelessWidget {
  const _CourseSummaryCard({required this.value, required this.onRetry});

  final AsyncValue<CourseDetail> value;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return value.when(
      data: (course) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(course.title, style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(course.code, style: theme.textTheme.bodyMedium),
              if (course.level != null) ...[
                const SizedBox(height: 8),
                Text(course.level!, style: theme.textTheme.bodyMedium),
              ],
              if (course.seatsLeft != null) ...[
                const SizedBox(height: 12),
                Text(l10n.seatsLeft(course.seatsLeft!), style: theme.textTheme.bodyMedium),
              ],
            ],
          ),
        ),
      ),
      error: (error, _) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.errorMessage, style: theme.textTheme.bodyMedium),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: onRetry,
                child: Text(l10n.retry),
              ),
            ],
          ),
        ),
      ),
      loading: () => const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }
}

class _SectionSelector extends StatelessWidget {
  const _SectionSelector({
    required this.value,
    required this.selectedSectionId,
    required this.onChanged,
    required this.onRetry,
  });

  final AsyncValue<List<SectionSummary>> value;
  final String? selectedSectionId;
  final ValueChanged<String?> onChanged;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);

    return value.when(
      data: (sections) {
        if (sections.isEmpty) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(l10n.noSectionsMessage),
            ),
          );
        }
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.selectSection, style: theme.textTheme.titleMedium),
                const SizedBox(height: 12),
                for (final section in sections)
                  RadioListTile<String>(
                    value: section.id,
                    groupValue: selectedSectionId,
                    onChanged: onChanged,
                    title: Text(section.title ?? l10n.sectionFallbackTitle(section.id)),
                    subtitle: _buildSubtitle(context, section),
                  ),
              ],
            ),
          ),
        );
      },
      error: (error, _) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.errorMessage),
              const SizedBox(height: 12),
              FilledButton(onPressed: onRetry, child: Text(l10n.retry)),
            ],
          ),
        ),
      ),
      loading: () => const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }

  Widget? _buildSubtitle(BuildContext context, SectionSummary section) {
    final l10n = context.l10n;
    final weekday = section.weekday;
    final startTime = section.startTime;
    final endTime = section.endTime;
    final instructor = section.instructorName;

    final parts = <String>[];
    if (weekday != null) {
      final narrowWeekdays = MaterialLocalizations.of(context).narrowWeekdays;
      final index = (weekday - 1).clamp(0, narrowWeekdays.length - 1);
      parts.add(narrowWeekdays[index]);
    }
    if (startTime != null && endTime != null) {
      parts.add('$startTime - $endTime');
    }
    if (instructor != null && instructor.isNotEmpty) {
      parts.add('${l10n.instructorLabel}: $instructor');
    }
    if (parts.isEmpty) {
      return null;
    }
    return Text(parts.join(' • '));
  }
}
