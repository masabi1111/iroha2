import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/notifications/local_notifications.dart';
import 'core/notifications/notifications.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initFirebase();
  await initializeNotificationPlugin();
  await requestPermissions();
  await configureHandlers();

  runApp(const ProviderScope(child: IrohaApp()));
}
