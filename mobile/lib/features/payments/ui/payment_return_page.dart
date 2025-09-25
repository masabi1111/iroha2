import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';

class PaymentReturnPage extends StatelessWidget {
  const PaymentReturnPage({required this.uri, super.key});

  final Uri uri;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final enrollmentId = uri.queryParameters['enrollmentId'];
    final status = uri.queryParameters['status'];

    final statusText = status != null && status.isNotEmpty
        ? '${l10n.paymentStatusLabel}: $status'
        : null;
    final enrollmentText = enrollmentId != null && enrollmentId.isNotEmpty
        ? l10n.paymentReturnEnrollment(enrollmentId)
        : null;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.paymentReturnTitle)),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    l10n.paymentReturnVerifying,
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  if (enrollmentText != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      enrollmentText,
                      textAlign: TextAlign.center,
                    ),
                  ],
                  if (statusText != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      statusText,
                      textAlign: TextAlign.center,
                    ),
                  ],
                  const SizedBox(height: 32),
                  FilledButton(
                    onPressed: () {
                      Navigator.of(context).pushNamedAndRemoveUntil(
                        '/dashboard',
                        (route) => route.settings.name == '/' || route.isFirst,
                      );
                    },
                    child: Text(l10n.goToDashboard),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
