# Mobile app is React Native (bare CLI), Android first, iOS second

The mobile app is built with bare React Native CLI using `@react-native-firebase` as the Firebase SDK. Android ships first; iOS follows from the same codebase.

We considered three alternatives: native Kotlin (Android-only), native Swift (iOS-only, as originally planned), and Expo managed workflow. Native Kotlin would require rewriting everything in Swift when iOS ships. Swift was the original plan but the team decided Android reach comes first. Expo managed workflow was ruled out because `@react-native-firebase` requires native modules that don't run inside Expo Go, making the custom-dev-client overhead outweigh Expo's benefits.

Bare React Native CLI gives full control of the native build layer (Android Studio for Android, Xcode for iOS) with no managed abstraction in between. `@react-native-firebase` is the idiomatic choice for this setup — native performance, offline persistence, and full SDK parity with the web client.

**Consequences:** Android Studio is required to build and run the Android target. When iOS work begins, Xcode and CocoaPods become additional requirements. The mobile directory (`mobile/`) lives as a sibling to `electron/` and `src/` in the monorepo.
