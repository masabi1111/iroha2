import 'package:flutter/material.dart';

class PaymentReturnPage extends StatelessWidget {
  const PaymentReturnPage({
    super.key,
    this.status,
    this.providerRef,
  });

  final String? status;
  final String? providerRef;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Payment Return')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thanks for completing the checkout flow.',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            const Text(
              'We\'re verifying your payment details. You\'ll receive a confirmation once the backend webhook activates your enrollment.',
            ),
            const SizedBox(height: 24),
            if (status != null) ...[
              Text('Status: $status'),
              const SizedBox(height: 8),
            ],
            if (providerRef != null) ...[
              Text('Reference: $providerRef'),
              const SizedBox(height: 24),
            ] else ...[
              const SizedBox(height: 24),
            ],
            FilledButton(
              onPressed: () {
                Navigator.of(context)
                    .pushNamedAndRemoveUntil('/dashboard', (route) => route.isFirst);
              },
              child: const Text('Go to Dashboard'),
            ),
          ],
        ),
      ),
    );
  }
}
