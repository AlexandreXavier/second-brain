# CONTEXT.md

Domain glossary for the Video Second Brain app — a shared visual library of video ideas used by a small team across web, desktop, and iOS.

## Language

**Idea**:
A saved item in the shared library — a YouTube video, tweet, Instagram post, article, screenshot, or loose text note.
_Avoid_: Post, item, card, entry

**Library**:
The full collection of ideas in the shared Firestore `ideas` collection.
_Avoid_: Database, feed, list

**Capture**:
The act of saving a new idea — either by pasting a URL, uploading a screenshot, or typing a loose note.
_Avoid_: Save, submit, add, post

**User scope filter**:
A two-state view toggle ("Minhas ideias" / "Toda a equipa") that determines which ideas are visible. "Minhas ideias" shows only ideas where `createdBy.uid` matches the signed-in user. "Toda a equipa" shows all ideas regardless of author. The category strip and item count both derive from the scoped set.
_Avoid_: Workspace filter, team filter, owner filter

**Platform**:
One of the three delivery surfaces: web, desktop, or iOS. All three share the same Firebase backend — same Firestore library, same Auth, same Storage bucket.
_Avoid_: App, client, version

**Desktop app**:
The Electron client. Its renderer is the existing web app's React/Vite build — the web source is not duplicated. Native OS features (menus, drag-to-window) are added via the Electron main process.
_Avoid_: Mac app, native app, Electron app

**iOS app**:
The SwiftUI mobile client. Scope: browse the library and quick-capture (URL paste or camera roll). Does not include editing or deleting existing ideas.
_Avoid_: Mobile app, phone app

**Agent**:
An automated process (e.g. Claude Code, Codex) that reads and writes the library via the `agentApi` Function using an `x-agent-token`. Distinct from a human user signed in with Firebase Auth.
_Avoid_: Bot, script, automation

**Quick capture**:
The iOS-specific capture flow: paste a URL to fetch a metadata preview, or pick an image from the camera roll. Writes directly to Firestore via the Firebase iOS SDK, not through the agent API.
_Avoid_: Mobile capture, iOS save

## Relationships

- A **Platform** reads and writes the shared **Library** via Firebase Auth + Firestore SDK (web, desktop, iOS) or via the `agentApi` Function (agents only)
- A **Capture** produces one **Idea** in the **Library**
- **Quick capture** is the **Capture** flow specific to the iOS **Platform**
- The **User scope filter** is a client-side view preference — it does not affect what is stored or what Firestore returns

## Example dialogue

> **Dev:** "When an **agent** does a **capture**, does it go through the same path as a human?"
> **Domain expert:** "No — agents POST to `agentApi` with an `x-agent-token`. Human **platforms** write directly to Firestore using Firebase Auth. The **idea** document shape is the same either way."

> **Dev:** "If I'm on iOS and I switch the **user scope filter** to 'Toda a equipa', will I see ideas saved by the **agent**?"
> **Domain expert:** "Yes — 'Toda a equipa' shows all ideas in the **library** regardless of who or what created them."

## Flagged ambiguities

- "workspace" was proposed as a scoping mechanism — resolved: there is no workspace model. The **user scope filter** is a client-side view preference only. See ADR-0001.
- "save" was used interchangeably with **capture** — resolved: use **capture** for the act, **idea** for the result.
