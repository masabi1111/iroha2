import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_api.dart';
import '../data/token_store.dart';
import '../domain/user.dart';

sealed class AuthState {
  const AuthState();
}

class AuthStateUnauthenticated extends AuthState {
  const AuthStateUnauthenticated();
}

class AuthStateAuthenticating extends AuthState {
  const AuthStateAuthenticating();
}

class AuthStateAuthenticated extends AuthState {
  const AuthStateAuthenticated(this.user);

  final User user;
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(authApiProvider);
  final store = ref.watch(tokenStoreProvider);
  return AuthNotifier(api: api, tokenStore: store)..restoreSession();
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier({required AuthApi api, required TokenStore tokenStore})
      : _api = api,
        _tokenStore = tokenStore,
        super(const AuthStateUnauthenticated());

  final AuthApi _api;
  final TokenStore _tokenStore;
  Completer<void>? _restoreCompleter;

  Future<void> restoreSession() async {
    if (_restoreCompleter != null) {
      return _restoreCompleter!.future;
    }

    final completer = Completer<void>();
    _restoreCompleter = completer;
    try {
      final refreshToken = await _tokenStore.readRefreshToken();
      final accessToken = await _tokenStore.readAccessToken();
      if (refreshToken == null || accessToken == null) {
        await _tokenStore.clearTokens();
        state = const AuthStateUnauthenticated();
        completer.complete();
        return;
      }

      state = const AuthStateAuthenticating();
      try {
        final user = await _api.me();
        state = AuthStateAuthenticated(user);
      } on Exception {
        await _tokenStore.clearTokens();
        state = const AuthStateUnauthenticated();
      }
      completer.complete();
    } finally {
      _restoreCompleter = null;
    }
  }

  Future<User> login({required String email, required String password}) async {
    state = const AuthStateAuthenticating();
    try {
      final response = await _api.login(email: email, password: password);
      final user = response.user;
      state = AuthStateAuthenticated(user);
      return user;
    } on Exception {
      await _tokenStore.clearTokens();
      state = const AuthStateUnauthenticated();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _tokenStore.clearTokens();
    state = const AuthStateUnauthenticated();
  }
}
