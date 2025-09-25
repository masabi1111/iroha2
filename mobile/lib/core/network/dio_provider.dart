import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/api_config.dart';
import '../../features/auth/data/token_store.dart';

final dioProvider = Provider<Dio>((ref) {
  final tokenStore = ref.watch(tokenStoreProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: apiBase,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
    ),
  );

  dio.interceptors.add(
    QueuedInterceptorsWrapper(
      onRequest: (options, handler) async {
        if (options.extra['skipAuth'] == true) {
          handler.next(options);
          return;
        }
        final accessToken = await tokenStore.readAccessToken();
        if (accessToken != null && accessToken.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $accessToken';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final response = error.response;
        if (error.requestOptions.extra['skipAuth'] == true) {
          handler.next(error);
          return;
        }
        if (response?.statusCode != 401 || error.requestOptions.extra['retried'] == true) {
          handler.next(error);
          return;
        }
        final refreshToken = await tokenStore.readRefreshToken();
        if (refreshToken == null || refreshToken.isEmpty) {
          await tokenStore.clearTokens();
          handler.next(error);
          return;
        }

        try {
          final refreshDio = Dio(
            BaseOptions(
              baseUrl: apiBase,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 15),
            ),
          );
          final refreshResponse = await refreshDio.post<Map<String, dynamic>>(
            '/auth/refresh',
            data: {'refreshToken': refreshToken},
          );
          final data = refreshResponse.data ?? <String, dynamic>{};
          final newAccessToken = data['accessToken'] as String?;
          final newRefreshToken = data['refreshToken'] as String?;
          if (newAccessToken == null || newRefreshToken == null) {
            await tokenStore.clearTokens();
            handler.next(error);
            return;
          }
          await tokenStore.saveTokens(accessToken: newAccessToken, refreshToken: newRefreshToken);

          final requestOptions = error.requestOptions;
          requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
          requestOptions.extra = {
            ...requestOptions.extra,
            'retried': true,
          };
          final retryResponse = await dio.fetch(requestOptions);
          handler.resolve(retryResponse);
        } on DioException {
          await tokenStore.clearTokens();
          handler.next(error);
        } catch (_) {
          await tokenStore.clearTokens();
          handler.next(error);
        }
      },
    ),
  );

  return dio;
});
