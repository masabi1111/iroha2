import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const AndroidNotificationChannel _defaultAndroidChannel = AndroidNotificationChannel(
  'iroha_default',
  'Iroha notifications',
  description: 'General course updates and reminders.',
  importance: Importance.high,
);

final FlutterLocalNotificationsPlugin _localNotificationsPlugin = FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  final plugin = FlutterLocalNotificationsPlugin();
  await NotificationService._initializeLocalNotifications(plugin);
  await NotificationService.showRemoteMessageNotification(message, plugin: plugin);
}

final firebaseMessagingProvider = Provider<FirebaseMessaging>((ref) {
  return FirebaseMessaging.instance;
});

final fcmTokenProvider = StreamProvider<String?>((ref) async* {
  final messaging = ref.watch(firebaseMessagingProvider);
  final initialToken = await messaging.getToken();
  yield initialToken;
  yield* messaging.onTokenRefresh;
});

class NotificationService {
  NotificationService._();

  static Future<void> initialize() async {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    await _initializeFirebaseMessaging();
    await _initializeLocalNotifications(_localNotificationsPlugin);

    FirebaseMessaging.onMessage.listen((message) async {
      await showRemoteMessageNotification(message);
    });
  }

  static Future<void> _initializeFirebaseMessaging() async {
    final messaging = FirebaseMessaging.instance;

    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );

    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  static Future<void> _initializeLocalNotifications(FlutterLocalNotificationsPlugin plugin) async {
    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );

    await plugin.initialize(initializationSettings);

    final androidPlugin = plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_defaultAndroidChannel);
  }

  static Future<void> showRemoteMessageNotification(
    RemoteMessage message, {
    FlutterLocalNotificationsPlugin? plugin,
  }) async {
    final usedPlugin = plugin ?? _localNotificationsPlugin;
    final notification = message.notification;

    final title = notification?.title ?? message.data['title'] as String?;
    final body = notification?.body ?? message.data['body'] as String?;

    if (title == null && body == null) {
      return;
    }

    final androidDetails = AndroidNotificationDetails(
      _defaultAndroidChannel.id,
      _defaultAndroidChannel.name,
      channelDescription: _defaultAndroidChannel.description,
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    final payload = message.data.isEmpty ? null : jsonEncode(message.data);

    await usedPlugin.show(
      notification?.hashCode ?? message.hashCode,
      title,
      body,
      NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      ),
      payload: payload,
    );
  }

  static Future<void> subscribeToCourseTopic(String courseId) async {
    if (courseId.isEmpty) {
      return;
    }

    await FirebaseMessaging.instance.subscribeToTopic('courses/$courseId');
  }
}
