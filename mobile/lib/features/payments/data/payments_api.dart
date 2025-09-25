import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

class PaymentIntent {
  const PaymentIntent({this.checkoutUrl, this.provider, this.providerRef});

  factory PaymentIntent.fromJson(Map<String, dynamic> json) {
    return PaymentIntent(
      checkoutUrl: json['checkoutUrl'] as String? ?? json['checkout_url'] as String?,
      provider: json['provider'] as String?,
      providerRef: json['providerRef'] as String? ?? json['provider_ref'] as String?,
    );
  }

  final String? checkoutUrl;
  final String? provider;
  final String? providerRef;
}

class PaymentsApi {
  const PaymentsApi(this._dio);

  final Dio _dio;

  Future<PaymentIntent> createIntent({
    required String enrollmentId,
    required String returnUrl,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/payments/${Uri.encodeComponent(enrollmentId)}/intent',
      data: {'returnUrl': returnUrl},
    );
    final data = response.data ?? <String, dynamic>{};
    return PaymentIntent.fromJson(data);
  }
}

final paymentsApiProvider = Provider<PaymentsApi>((ref) {
  final dio = ref.watch(dioProvider);
  return PaymentsApi(dio);
});
