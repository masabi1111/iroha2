import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/logic/auth_notifier.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final isLoading = authState is AuthStateAuthenticating;
    final isAuthenticated = authState is AuthStateAuthenticated;

    return Scaffold(
      appBar: AppBar(
        title: const Text('iroha'),
        actions: [
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
                ],
              ),
      ),
    );
  }
}
