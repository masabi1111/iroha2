import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/notifications/local_notifications.dart';
import '../../core/notifications/notifications.dart';

class NotificationsDebugPage extends ConsumerStatefulWidget {
  const NotificationsDebugPage({super.key});

  @override
  ConsumerState<NotificationsDebugPage> createState() =>
      _NotificationsDebugPageState();
}

class _NotificationsDebugPageState
    extends ConsumerState<NotificationsDebugPage> {
  late final TextEditingController _topicController;

  @override
  void initState() {
    super.initState();
    _topicController = TextEditingController(text: 'test');
  }

  @override
  void dispose() {
    _topicController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokenAsync = ref.watch(fcmTokenProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications Debug'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'FCM Token',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          tokenAsync.when(
            data: (token) => SelectableText(token ?? 'Unavailable'),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Text('Error: $error'),
          ),
          const SizedBox(height: 8),
          ElevatedButton.icon(
            onPressed: tokenAsync.maybeWhen(
              data: (token) => token == null
                  ? null
                  : () async {
                      await Clipboard.setData(ClipboardData(text: token));
                      if (!mounted) {
                        return;
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Token copied to clipboard')),
                      );
                    },
              orElse: () => null,
            ),
            icon: const Icon(Icons.copy),
            label: const Text('Copy token'),
          ),
          const Divider(height: 32),
          TextField(
            controller: _topicController,
            decoration: const InputDecoration(
              labelText: 'Course ID',
              hintText: '123',
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    final topic = _topicController.text.trim();
                    if (topic.isEmpty) {
                      return;
                    }
                    await subscribeToCourseTopic(topic);
                    if (!mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Subscribed to course_$topic')),
                    );
                  },
                  child: const Text('Subscribe'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    final topic = _topicController.text.trim();
                    if (topic.isEmpty) {
                      return;
                    }
                    await unsubscribeFromCourseTopic(topic);
                    if (!mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Unsubscribed from course_$topic')),
                    );
                  },
                  child: const Text('Unsubscribe'),
                ),
              ),
            ],
          ),
          const Divider(height: 32),
          ElevatedButton(
            onPressed: () async {
              final message = RemoteMessage(
                notification: const RemoteNotification(
                  title: 'Local test notification',
                  body: 'Triggered from debug tools.',
                ),
                data: const <String, dynamic>{},
              );
              await showLocalNotification(message);
            },
            child: const Text('Send test local notification'),
          ),
        ],
      ),
    );
  }
}
