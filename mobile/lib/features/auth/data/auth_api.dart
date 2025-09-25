import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../domain/user.dart';
import 'token_store.dart';

class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken});

  final String accessToken;
  final String refreshToken;
}

class LoginResponse {
  const LoginResponse({required this.tokens, required this.user});

  final AuthTokens tokens;
  final User user;
}

final authApiProvider = Provider<AuthApi>((ref) {
  final dio = ref.watch(dioProvider);
  final store = ref.watch(tokenStoreProvider);
  return AuthApi(dio, store);
});

class AuthApi {
  AuthApi(this._dio, this._tokenStore);

  final Dio _dio;
  final TokenStore _tokenStore;

  Future<LoginResponse> login({required String email, required String password}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
      options: Options(extra: {'skipAuth': true}),
    );

    final data = response.data ?? <String, dynamic>{};
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    final userJson = data['user'] as Map<String, dynamic>?;

    if (accessToken == null || refreshToken == null || userJson == null) {
      throw DioException(
        requestOptions: response.requestOptions,
        message: 'Invalid login response.',
      );
    }

    final user = User.fromJson(userJson);
    final tokens = AuthTokens(accessToken: accessToken, refreshToken: refreshToken);
    await _tokenStore.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    return LoginResponse(tokens: tokens, user: user);
  }

  Future<AuthTokens> refresh({required String refreshToken}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
      options: Options(extra: {'skipAuth': true}),
    );
    final data = response.data ?? <String, dynamic>{};
    final accessToken = data['accessToken'] as String?;
    final newRefreshToken = data['refreshToken'] as String?;
    if (accessToken == null || newRefreshToken == null) {
      throw DioException(
        requestOptions: response.requestOptions,
        message: 'Invalid refresh response.',
      );
    }
    await _tokenStore.saveTokens(accessToken: accessToken, refreshToken: newRefreshToken);
    return AuthTokens(accessToken: accessToken, refreshToken: newRefreshToken);
  }

  Future<User> me() async {
    final response = await _dio.get<Map<String, dynamic>>('/me');
    final data = response.data ?? <String, dynamic>{};
    return User.fromJson(data);
  }
}
