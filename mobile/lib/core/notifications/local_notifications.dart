import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

const AndroidNotificationChannel irohaDefaultChannel = AndroidNotificationChannel(
  'iroha_default',
  'Iroha Notifications',
  description: 'Default notification channel for iroha.',
  importance: Importance.high,
);

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

typedef LocalNotificationTapCallback = Future<void> Function(String payload);

LocalNotificationTapCallback? _notificationTapCallback;

void setLocalNotificationTapCallback(LocalNotificationTapCallback? callback) {
  _notificationTapCallback = callback;
}

Future<void> initializeNotificationPlugin() async {
  const initializationSettings = InitializationSettings(
    android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    iOS: DarwinInitializationSettings(),
  );

  await flutterLocalNotificationsPlugin.initialize(
    initializationSettings,
    onDidReceiveNotificationResponse: (response) async {
      final payload = response.payload;
      if (payload == null || payload.isEmpty) {
        return;
      }
      final handler = _notificationTapCallback;
      if (handler != null) {
        await handler(payload);
      }
    },
  );

  final androidImplementation = flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
  await androidImplementation?.createNotificationChannel(irohaDefaultChannel);
}

Future<void> showLocalNotification(RemoteMessage message) async {
  final notification = message.notification;
  final payload = message.data['deep_link'] ?? message.data['payload'];

  final androidDetails = AndroidNotificationDetails(
    irohaDefaultChannel.id,
    irohaDefaultChannel.name,
    channelDescription: irohaDefaultChannel.description,
    importance: irohaDefaultChannel.importance,
    priority: Priority.high,
    icon: notification?.android?.smallIcon,
  );

  const iosDetails = DarwinNotificationDetails();

  final notificationDetails = NotificationDetails(
    android: androidDetails,
    iOS: iosDetails,
  );

  await flutterLocalNotificationsPlugin.show(
    notification?.hashCode ?? message.hashCode,
    notification?.title ?? message.data['title'],
    notification?.body ?? message.data['body'],
    notificationDetails,
    payload: payload,
  );
}
