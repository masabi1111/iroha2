import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/network/dio_provider.dart';
import 'features/auth/logic/auth_notifier.dart';
import 'features/auth/ui/login_page.dart';
import 'features/home/ui/home_page.dart';
import 'features/home/ui/dashboard_page.dart';
import 'features/enroll/ui/enroll_page.dart';
import 'features/payments/ui/checkout_page.dart';
import 'features/payments/ui/payment_return_page.dart';

class IrohaApp extends ConsumerWidget {
  const IrohaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(dioProvider); // ensure provider initialized early
    ref.watch(authNotifierProvider); // warm up auth state listeners

    return MaterialApp(
      title: 'iroha',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      onGenerateRoute: (settings) => _resolveRoute(settings),
      onUnknownRoute: (settings) => MaterialPageRoute<void>(
        builder: (_) => const HomePage(),
        settings: settings,
      ),
    );
  }

  Route<dynamic> _resolveRoute(RouteSettings settings) {
    final name = settings.name ?? '/';
    final uri = Uri.parse(name);
    final queryParams = uri.queryParameters;

    final segments = _normalizeSegments(uri);

    if (segments.isEmpty) {
      return MaterialPageRoute<void>(
        builder: (_) => const HomePage(),
        settings: settings,
      );
    }

    if (segments.length == 1) {
      switch (segments.first) {
        case 'login':
          return MaterialPageRoute<void>(
            builder: (_) => const LoginPage(),
            settings: settings,
          );
        case 'dashboard':
          return MaterialPageRoute<void>(
            builder: (_) => const DashboardPage(),
            settings: settings,
          );
        case 'payment':
          return MaterialPageRoute<void>(
            builder: (_) => PaymentReturnPage(
              status: queryParams['status'],
              providerRef: queryParams['providerRef'],
            ),
            settings: settings,
          );
      }
    }

    if (segments.length == 2) {
      if (segments[0] == 'enroll') {
        final courseId = int.tryParse(segments[1]);
        if (courseId != null) {
          return MaterialPageRoute<void>(
            builder: (_) => EnrollPage(courseId: courseId),
            settings: settings,
          );
        }
      } else if (segments[0] == 'checkout') {
        final enrollmentId = segments[1];
        if (enrollmentId.isNotEmpty) {
          return MaterialPageRoute<void>(
            builder: (_) => CheckoutPage(enrollmentId: enrollmentId),
            settings: settings,
          );
        }
      } else if (segments[0] == 'payment' && segments[1] == 'return') {
        return MaterialPageRoute<void>(
          builder: (_) => PaymentReturnPage(
            status: queryParams['status'],
            providerRef: queryParams['providerRef'],
          ),
          settings: settings,
        );
      }
    }

    return MaterialPageRoute<void>(
      builder: (_) => const HomePage(),
      settings: settings,
    );
  }

  List<String> _normalizeSegments(Uri uri) {
    if (uri.scheme == 'iroha' && uri.host == 'payment') {
      return <String>['payment', ...uri.pathSegments.where((segment) => segment.isNotEmpty)];
    }

    if (uri.scheme.isNotEmpty && uri.host.isNotEmpty && uri.pathSegments.isEmpty) {
      return <String>[uri.host];
    }

    return uri.pathSegments.where((segment) => segment.isNotEmpty).toList();
  }
}
