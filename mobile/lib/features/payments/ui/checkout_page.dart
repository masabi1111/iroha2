import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/payments_api.dart';

class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({required this.enrollmentId, super.key});

  final String enrollmentId;

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  bool _isLoading = true;
  String? _checkoutUrl;
  String? _providerRef;
  String? _error;
  bool _hasAttemptedAutoLaunch = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _checkoutUrl = null;
      _providerRef = null;
      _hasAttemptedAutoLaunch = false;
    });

    try {
      final intent = await ref
          .read(paymentsApiProvider)
          .createIntent(enrollmentId: widget.enrollmentId);
      if (!mounted) {
        return;
      }

      setState(() {
        _providerRef = intent.providerRef;
        _checkoutUrl = intent.checkoutUrl;
      });

      if (intent.checkoutUrl != null && !_hasAttemptedAutoLaunch) {
        await _openCheckout(intent.checkoutUrl!);
        if (!mounted) {
          return;
        }
        setState(() {
          _hasAttemptedAutoLaunch = true;
        });
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Unable to prepare checkout. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _openCheckout(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid checkout link.')),
      );
      return;
    }

    final launched = await launchUrl(
      uri,
      mode: LaunchMode.inAppBrowserView,
      webOnlyWindowName: '_blank',
    );

    if (!launched) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open checkout automatically.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content;
    if (_isLoading) {
      content = const Center(child: CircularProgressIndicator());
    } else if (_error != null) {
      content = Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _error!,
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: Theme.of(context).colorScheme.error),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _initialize,
            child: const Text('Retry'),
          ),
        ],
      );
    } else {
      final checkoutUrl = _checkoutUrl;
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_providerRef != null) ...[
            Text('Reference: $_providerRef'),
            const SizedBox(height: 12),
          ],
          if (checkoutUrl != null) ...[
            const Text(
              'We\'ve opened the payment page in a secure browser. If it didn\'t appear, tap below to open it.',
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => _openCheckout(checkoutUrl),
              child: const Text('Open Checkout'),
            ),
          ] else ...[
            const Text(
              'The payment provider is processing your request. You\'ll receive updates shortly.',
            ),
          ],
          const SizedBox(height: 24),
          FilledButton.tonal(
            onPressed: () {
              Navigator.of(context)
                  .pushNamedAndRemoveUntil('/dashboard', (route) => route.isFirst);
            },
            child: const Text('Return to Dashboard'),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: content,
      ),
    );
  }
}
