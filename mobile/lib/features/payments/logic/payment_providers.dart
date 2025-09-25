import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/payments_api.dart';

Uri buildPaymentReturnUri(String enrollmentId, {Map<String, String>? extra}) {
  return Uri(
    scheme: 'iroha',
    host: 'payment',
    path: '/return',
    queryParameters: {
      'enrollmentId': enrollmentId,
      if (extra != null) ...extra,
    },
  );
}

final paymentIntentProvider = FutureProvider.family.autoDispose<PaymentIntent, String>((ref, enrollmentId) async {
  final api = ref.watch(paymentsApiProvider);
  final returnUrl = buildPaymentReturnUri(enrollmentId).toString();
  return api.createIntent(enrollmentId: enrollmentId, returnUrl: returnUrl);
});
