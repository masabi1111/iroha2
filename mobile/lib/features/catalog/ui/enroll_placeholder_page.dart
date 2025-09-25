import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';

class EnrollPlaceholderPage extends StatelessWidget {
  const EnrollPlaceholderPage({required this.courseId, super.key});

  final String courseId;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.enroll),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            l10n.enrollmentPlaceholder(courseId),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
