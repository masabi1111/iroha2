import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/network/dio_provider.dart';
import 'features/auth/logic/auth_notifier.dart';
import 'features/auth/ui/login_page.dart';
import 'features/home/ui/home_page.dart';
import 'features/home/ui/dashboard_page.dart';
import 'features/catalog/ui/course_detail_page.dart';
import 'features/enroll/ui/enroll_page.dart';
import 'features/catalog/ui/season_detail_page.dart';
import 'features/catalog/ui/seasons_page.dart';
import 'features/payments/ui/checkout_page.dart';
import 'features/payments/ui/payment_return_page.dart';
import 'l10n/app_localizations.dart';

class IrohaApp extends ConsumerWidget {
  const IrohaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(dioProvider); // ensure provider initialized early

    return MaterialApp(
      title: 'iroha',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
      initialRoute: '/',
      routes: {
        '/': (_) => const HomePage(),
        '/login': (_) => const LoginPage(),
        '/dashboard': (_) => const DashboardPage(),
        '/seasons': (_) => const SeasonsPage(),
      },
      onGenerateRoute: (settings) {
        final name = settings.name;
        if (name == null) {
          return null;
        }
        final uri = Uri.parse(name);
        if (uri.pathSegments.length == 2 && uri.pathSegments.first == 'seasons') {
          final seasonCode = uri.pathSegments[1];
          return MaterialPageRoute<void>(
            builder: (_) => SeasonDetailPage(seasonCode: seasonCode),
            settings: settings,
          );
        }
        if (uri.pathSegments.length == 2 && uri.pathSegments.first == 'courses') {
          final courseId = uri.pathSegments[1];
          return MaterialPageRoute<void>(
            builder: (_) => CourseDetailPage(courseId: courseId),
            settings: settings,
          );
        }
        if (uri.scheme == 'iroha' && uri.host == 'payment' && uri.path == '/return') {
          return MaterialPageRoute<void>(
            builder: (_) => PaymentReturnPage(uri: uri),
            settings: settings,
          );
        }
        if (uri.pathSegments.length == 2 && uri.pathSegments.first == 'enroll') {
          final courseId = uri.pathSegments[1];
          return MaterialPageRoute<void>(
            builder: (_) => EnrollPage(courseId: courseId),
            settings: settings,
          );
        }
        if (uri.pathSegments.length == 2 && uri.pathSegments.first == 'checkout') {
          final enrollmentId = uri.pathSegments[1];
          return MaterialPageRoute<void>(
            builder: (_) => CheckoutPage(enrollmentId: enrollmentId),
            settings: settings,
          );
        }
        return null;
      },
    );
  }
}
