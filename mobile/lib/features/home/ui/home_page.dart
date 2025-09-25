import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/logic/auth_notifier.dart';
import '../../../l10n/app_localizations.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final isLoading = authState is AuthStateAuthenticating;
    final isAuthenticated = authState is AuthStateAuthenticated;
    var showDebugTools = false;
    assert(() {
      showDebugTools = true;
      return true;
    }());

    return Scaffold(
      appBar: AppBar(
        title: const Text('iroha'),
        actions: [
          if (showDebugTools)
            IconButton(
              tooltip: 'Notifications debug',
              onPressed: () {
                Navigator.of(context).pushNamed('/debug/notifications');
              },
              icon: const Icon(Icons.notifications_active_outlined),
            ),
          if (isAuthenticated)
            IconButton(
              tooltip: 'Logout',
              onPressed: () async {
                await ref.read(authNotifierProvider.notifier).logout();
              },
              icon: const Icon(Icons.logout),
            ),
        ],
      ),
      body: Center(
        child: isLoading
            ? const CircularProgressIndicator()
            : Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isAuthenticated
                        ? 'Welcome back, ${(authState as AuthStateAuthenticated).user.email}!'
                        : 'Welcome to iroha',
                    style: Theme.of(context).textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      if (isAuthenticated) {
                        Navigator.of(context).pushNamed('/dashboard');
                      } else {
                        Navigator.of(context).pushNamed('/login');
                      }
                    },
                    child: Text(isAuthenticated ? 'Dashboard' : 'Login'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/seasons');
                    },
                    child: Text(context.l10n.viewSeasons),
                  ),
                ],
              ),
      ),
    );
  }
}
