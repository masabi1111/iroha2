# iroha mobile

## Notifications

Firebase Cloud Messaging (FCM) and local notifications are configured in the
project but require you to supply your own Firebase configuration files:

1. Create or access the Firebase project for iroha.
2. Download `google-services.json` from the Firebase console and place it in
   `mobile/android/app/google-services.json`.
3. Download `GoogleService-Info.plist` and place it in
   `mobile/ios/Runner/GoogleService-Info.plist`.
4. For iOS, enable *Push Notifications* and *Background Modes → Remote
   notifications* in Xcode for the Runner target, and call `FirebaseApp.configure()`
   in `AppDelegate`.

The files above are ignored by git; do not commit them to the repository.

### Testing push notifications

1. Run the application on a physical device or emulator.
2. Open the notifications debug page (AppBar → Notifications debug) in a debug
   build and copy the displayed FCM token.
3. Use the Firebase console (Cloud Messaging) or your own backend to send a
   test push message to the copied token.
4. Foreground messages display a local notification. Background messages are
   handled by the background message handler defined in
   `lib/core/notifications/notifications.dart`.
