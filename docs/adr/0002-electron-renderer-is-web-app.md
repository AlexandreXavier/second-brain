# Electron desktop uses the web app as its renderer, not a native macOS UI

The Electron desktop app's renderer layer is the existing React/Vite web build. The Electron main process adds native OS features (menus, drag-to-window, auth redirect server) on top; it does not replace the UI.

We considered two alternatives: building a native macOS app in AppKit/SwiftUI-for-Mac, and building a separate Electron-native HTML/JS layer. The native macOS path would take months to reach feature parity and adds a second UI codebase to maintain. A separate Electron HTML layer duplicates the web app for no gain. Wrapping the existing build means the desktop app inherits every future web improvement for free.

**Consequences:** If deep macOS integration is ever needed — menu bar widget, Spotlight indexing, native AppKit controls — this approach hits a ceiling. The desktop app's visual fidelity is bounded by Chromium rendering. If that becomes a requirement, the right move is a separate SwiftUI-for-Mac app, not patching the Electron wrapper.
