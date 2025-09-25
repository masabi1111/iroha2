import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import 'local_notifications.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

final Provider<FirebaseMessaging> firebaseMessagingProvider =
    Provider<FirebaseMessaging>((ref) {
  return FirebaseMessaging.instance;
});

final StreamProvider<String?> fcmTokenProvider =
    StreamProvider<String?>((ref) async* {
  final messaging = ref.watch(firebaseMessagingProvider);
  final initialToken = await messaging.getToken();
  yield initialToken;
  yield* messaging.onTokenRefresh;
});

Future<void> initFirebase() async {
  await Firebase.initializeApp();
}

Future<NotificationSettings> requestPermissions() async {
  final messaging = FirebaseMessaging.instance;
  final settings = await messaging.requestPermission();
  await messaging.setForegroundNotificationPresentationOptions(
    alert: true,
    badge: true,
    sound: true,
  );
  return settings;
}

Future<String?> getFcmToken() {
  return FirebaseMessaging.instance.getToken();
}

Future<void> configureHandlers() async {
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  setLocalNotificationTapCallback((payload) async {
    await _handleDeepLink(payload);
  });

  FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
    await showLocalNotification(message);
  });

  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) async {
    final deepLink = message.data['deep_link'] as String?;
    if (deepLink != null && deepLink.isNotEmpty) {
      await _handleDeepLink(deepLink);
    }
  });

  final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
  if (initialMessage != null) {
    final deepLink = initialMessage.data['deep_link'] as String?;
    if (deepLink != null && deepLink.isNotEmpty) {
      unawaited(_handleDeepLink(deepLink));
    }
  }
}

Future<void> subscribeToCourseTopic(String courseId) {
  return FirebaseMessaging.instance.subscribeToTopic('course_$courseId');
}

Future<void> unsubscribeFromCourseTopic(String courseId) {
  return FirebaseMessaging.instance.unsubscribeFromTopic('course_$courseId');
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await initializeNotificationPlugin();
  await showLocalNotification(message);
}

Future<void> _handleDeepLink(String deepLink) async {
  final uri = Uri.tryParse(deepLink);
  if (uri == null) {
    return;
  }

  if (uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https')) {
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return;
  }

  final navigator = navigatorKey.currentState;
  if (navigator == null) {
    return;
  }

  if (uri.hasScheme) {
    await navigator.pushNamed(uri.toString());
  } else {
    await navigator.pushNamed(uri.toString());
  }
}
