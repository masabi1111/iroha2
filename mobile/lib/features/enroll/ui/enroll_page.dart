import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/enroll_api.dart';
import '../data/enrollment_catalog.dart';

class EnrollPage extends ConsumerStatefulWidget {
  const EnrollPage({required this.courseId, super.key});

  final int courseId;

  @override
  ConsumerState<EnrollPage> createState() => _EnrollPageState();
}

class _EnrollPageState extends ConsumerState<EnrollPage> {
  int? _selectedSectionId;
  bool _isSubmitting = false;
  String? _formError;

  EnrollmentCourseDetail? _lastLoadedCourse;

  Future<void> _submit() async {
    final course = _lastLoadedCourse;
    if (course == null) {
      return;
    }

    final requiresSection = course.sections.isNotEmpty;
    if (requiresSection && _selectedSectionId == null) {
      setState(() {
        _formError = 'Please choose a section to continue.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _formError = null;
    });

    try {
      final result = await ref.read(enrollApiProvider).enroll(
            courseId: course.id,
            sectionId: _selectedSectionId,
          );

      if (!mounted) {
        return;
      }

      final messenger = ScaffoldMessenger.of(context);
      switch (result.status) {
        case EnrollmentStatus.waitlisted:
          messenger.showSnackBar(
            SnackBar(
              content: Text(
                'You\'ve been waitlisted. We\'ll notify you if a seat opens (seats left: ${result.seatsLeft}).',
              ),
            ),
          );
          Navigator.of(context).pushNamedAndRemoveUntil(
            '/dashboard',
            (route) => route.isFirst,
          );
          break;
        case EnrollmentStatus.pending:
          messenger.showSnackBar(
            const SnackBar(content: Text('Enrollment pending. Redirecting to checkout...')),
          );
          Navigator.of(context).pushReplacementNamed('/checkout/${result.enrollmentId}');
          break;
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _formError = 'Enrollment failed. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final courseAsync = ref.watch(enrollmentCourseDetailProvider(widget.courseId));

    return Scaffold(
      appBar: AppBar(title: const Text('Enroll')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: courseAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Unable to load course details.'),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {
                    ref.invalidate(enrollmentCourseDetailProvider(widget.courseId));
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (course) {
            _lastLoadedCourse = course;
            return _EnrollmentForm(
              course: course,
              selectedSectionId: _selectedSectionId,
              isSubmitting: _isSubmitting,
              formError: _formError,
              onSectionChanged: (value) {
                setState(() {
                  _selectedSectionId = value;
                  _formError = null;
                });
              },
              onSubmit: _submit,
            );
          },
        ),
      ),
    );
  }
}

class _EnrollmentForm extends StatelessWidget {
  const _EnrollmentForm({
    required this.course,
    required this.selectedSectionId,
    required this.isSubmitting,
    required this.formError,
    required this.onSectionChanged,
    required this.onSubmit,
  });

  final EnrollmentCourseDetail course;
  final int? selectedSectionId;
  final bool isSubmitting;
  final String? formError;
  final ValueChanged<int?> onSectionChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            course.title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(course.description),
          const SizedBox(height: 24),
          if (course.sections.isNotEmpty) ...[
            Text(
              'Choose a section',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int>(
              value: selectedSectionId,
              items: course.sections
                  .map(
                    (section) => DropdownMenuItem<int>(
                      value: section.id,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(section.title),
                          if (section.schedule != null)
                            Text(
                              section.schedule!,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: Colors.grey[600]),
                            ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
              onChanged: isSubmitting ? null : onSectionChanged,
              hint: const Text('Select a section'),
            ),
            const SizedBox(height: 12),
          ],
          if (formError != null) ...[
            Text(
              formError!,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Theme.of(context).colorScheme.error),
            ),
            const SizedBox(height: 12),
          ],
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: isSubmitting ? null : onSubmit,
              child: isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit enrollment'),
            ),
          ),
        ],
      ),
    );
  }
}
