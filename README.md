# iroha

This repository hosts the product blueprint for **iroha (いろは)** — a seasonal Japanese distance-learning platform.

## Contents
- [`docs/blueprint.md`](docs/blueprint.md): end-to-end architecture, schema, API, and roadmap.

Use this blueprint as the foundation for implementing the backend (NestJS), frontend (Next.js), and mobile (Flutter/React Native) clients.

## Web App Environment

The Next.js client expects the following environment variable when running locally:

```bash
export NEXT_PUBLIC_RETURN_URL="http://localhost:3000/payment/return"
```

This URL is shared with the payment provider to handle the browser return flow after checkout.

## Mobile Push Notifications

The Flutter client includes Firebase Cloud Messaging (FCM) hooks and a local notification fallback. To finish the integration:

1. **Add the Firebase configuration files locally**: copy your real `google-services.json` into `mobile/android/app/` and `GoogleService-Info.plist` into `mobile/ios/Runner/`. The repository only ships placeholders, so keep the production files out of source control.
2. **Android manifest configuration**:
   - Ensure the app declares the following permissions inside `android/app/src/main/AndroidManifest.xml`:
     ```xml
     <uses-permission android:name="android.permission.INTERNET" />
     <uses-permission android:name="android.permission.WAKE_LOCK" />
     <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
     ```
   - Add the Firebase messaging service to the `<application>` tag if it is not already present:
     ```xml
     <service
         android:name="com.google.firebase.messaging.FirebaseMessagingService"
         android:exported="false">
         <intent-filter>
             <action android:name="com.google.firebase.MESSAGING_EVENT" />
         </intent-filter>
     </service>
     ```
3. **iOS capabilities**: enable *Push Notifications* and the *Background Modes → Remote notifications* capability for the Runner target in Xcode. This ensures that `FirebaseMessaging` can receive messages while the app is in the background.
4. **Runtime behaviour**: the app requests notification permissions on iOS, registers background and foreground handlers, and exposes the FCM token through a Riverpod provider. After a learner’s enrolment becomes `active`, call `NotificationService.subscribeToCourseTopic('courses/<courseId>')` to opt them into course-specific updates.
