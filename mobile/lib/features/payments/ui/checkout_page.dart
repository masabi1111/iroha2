import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../l10n/app_localizations.dart';
import '../data/payments_api.dart';
import '../logic/payment_providers.dart';

class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({required this.enrollmentId, super.key});

  final String enrollmentId;

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  bool _hasAttemptedAutoLaunch = false;

  @override
  void initState() {
    super.initState();
    ref.listen<AsyncValue<PaymentIntent>>(paymentIntentProvider(widget.enrollmentId), (previous, next) {
      next.whenOrNull(data: (intent) {
        final url = intent.checkoutUrl;
        if (!_hasAttemptedAutoLaunch && url != null && url.isNotEmpty) {
          _hasAttemptedAutoLaunch = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _launchCheckout(url);
            }
          });
        }
      });
    });
  }

  Future<void> _launchCheckout(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      _showSnackBar(context.l10n.paymentLaunchFailed);
      return;
    }
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      _showSnackBar(context.l10n.paymentLaunchFailed);
    }
  }

  void _showSnackBar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final intentValue = ref.watch(paymentIntentProvider(widget.enrollmentId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.checkoutTitle)),
      body: SafeArea(
        child: intentValue.when(
          data: (intent) {
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        l10n.paymentRedirecting,
                        style: theme.textTheme.titleMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      FilledButton.icon(
                        onPressed: intent.checkoutUrl != null && intent.checkoutUrl!.isNotEmpty
                            ? () => _launchCheckout(intent.checkoutUrl!)
                            : null,
                        icon: const Icon(Icons.open_in_new),
                        label: Text(l10n.openCheckout),
                      ),
                      if (intent.checkoutUrl == null || intent.checkoutUrl!.isEmpty) ...[
                        const SizedBox(height: 16),
                        Text(
                          l10n.paymentMissingCheckoutUrl,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          },
          error: (error, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    l10n.errorMessage,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () {
                      ref.invalidate(paymentIntentProvider(widget.enrollmentId));
                    },
                    child: Text(l10n.retry),
                  ),
                ],
              ),
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }
}
