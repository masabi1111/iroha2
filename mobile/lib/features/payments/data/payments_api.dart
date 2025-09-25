import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/payment_config.dart';
import '../../../core/network/dio_provider.dart';

@immutable
class PaymentIntentResponse {
  const PaymentIntentResponse({
    required this.providerRef,
    this.checkoutUrl,
  });

  final String providerRef;
  final String? checkoutUrl;
}

final paymentsApiProvider = Provider<PaymentsApi>((ref) {
  final dio = ref.watch(dioProvider);
  return PaymentsApi(dio);
});

class PaymentsApi {
  PaymentsApi(this._dio);

  final Dio _dio;

  Future<PaymentIntentResponse> createIntent({
    required String enrollmentId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/payments/$enrollmentId/intent',
      data: <String, dynamic>{'returnUrl': paymentReturnUrl},
    );

    final data = response.data ?? <String, dynamic>{};
    final providerRef = data['providerRef'] as String?;
    final checkoutUrl = data['checkoutUrl'] as String?;

    if (providerRef == null || providerRef.isEmpty) {
      throw DioException(
        requestOptions: response.requestOptions,
        message: 'Invalid payment intent response.',
      );
    }

    return PaymentIntentResponse(
      providerRef: providerRef,
      checkoutUrl: checkoutUrl,
    );
  }
}
