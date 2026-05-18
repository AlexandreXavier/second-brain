# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install client deps. Also run `cd functions && npm install` separately for Functions deps.
- `npm run dev` — Vite dev server, pinned to `--host localhost`. **Use `http://localhost:5173`, not `127.0.0.1`** — Firebase Auth blocks `127.0.0.1` unless it's manually added under Authentication → Settings → Authorized domains.
- `npm run build` — typecheck via `tsc --noEmit -p tsconfig.app.json`, then `vite build`. There is no separate lint or test command; the typecheck inside `build` is the only static check.
- `npm run preview` — serve the built `dist/` locally.
- `firebase deploy --only hosting,firestore:rules,storage,functions` — full deploy. Project is pinned to `my-brain-9d788` via `.firebaserc`.
- `cd functions && npm run serve` — run the Functions emulator for the agent API and `suggestTitle`.

No test runner is configured.

## Architecture

Single-page React + Vite + TypeScript app talking to Firebase (Auth, Firestore, Storage, Functions) in project `my-brain-9d788` (region `us-central1`).

**Client.** Almost the entire UI lives in `src/App.tsx` (~30 KB, ~1k lines). It subscribes to the shared `ideas` Firestore collection with `onSnapshot` and renders a masonry grid (CSS columns, no JS library); there is no router, no state library, and no component split beyond a few inline helpers. `src/lib/` holds the slim non-UI pieces:
- `firebase.ts` — initializes the Firebase SDK and exports `auth`, `db`, `storage`, `googleProvider`, plus the derived `agentApiUrl` / `suggestTitleApiUrl` (overridable via `VITE_AGENT_API_URL` / `VITE_SUGGEST_TITLE_API_URL`). Firebase web config is **hardcoded** here (and in `firebase.md`) — it is the public web API key, not a secret.
- `metadata.ts` — `createPreviewFromUrl` classifies a URL as `youtube` / `tweet` / `instagram` / `article` and hits the matching public oEmbed or microlink.io endpoint to fill an `IdeaDraft`. Each branch has a hardcoded fallback so saving never fails on a network error.
- `security.ts` — generates the raw agent token (base64url of 32 random bytes) and its SHA-256 hash. The raw token is **only** shown to the user; only the hash is persisted.
- `title.ts` — `suggestLiteralTitle` calls OpenRouter directly from the browser when `VITE_OPENROUTER_API_KEY` is present, otherwise POSTs to the `suggestTitle` Function with a Firebase ID token in `Authorization: Bearer …`.
- `types.ts` — `Idea`, `IdeaDraft`, `UserProfile`, `Creator`. The allowed `Idea` fields are duplicated as the `allowedIdeaFields` set in `functions/index.js`; keep them in sync.

**Functions (`functions/index.js`, CommonJS, Node 22).** Two HTTP entrypoints, both deployed to `us-central1`:
- `agentApi` — base URL `https://us-central1-my-brain-9d788.cloudfunctions.net/agentApi`. REST surface for agents over `/ideas` and `/ideas/:id` (GET list with optional `?search=`, POST, PATCH, DELETE) plus `/health`. Auth is the `x-agent-token` header: the function SHA-256-hashes it and looks up `agentTokens/{hash}` in Firestore. POST/PATCH go through `cleanIdeaPayload` which whitelists the same fields as `Idea`.
- `suggestTitle` — POST only, authenticated by a Firebase Auth ID token (`Authorization: Bearer …` → `admin.auth().verifyIdToken`). Calls OpenRouter (`google/gemma-4-31b-it:free`) and returns a sanitized ≤5-word title. Reads `OPENROUTER_API_KEY` from the Function env, not the web key.

**Data model.**
- `ideas/{id}` — the shared library. Documents have `createdAt`/`updatedAt` server timestamps and a `createdBy: { type: "human" | "agent", … }` discriminator so the UI can show whether an item came from a person or the agent API.
- `agentTokens/{sha256(token)}` — one document per agent token. Stores `{ active, tokenPreview, lastUsedAt, uid }`. Lookups by hash are the only way the function side learns whether a token is valid; raw tokens are never persisted.
- `profiles/{uid}` — `UserProfile`, including the current `agentTokenHash` so the UI can show "you have an active token". Note: the collection is `profiles`, not `users`.
- Storage uploads (screenshots, reference images) live under the default bucket.

**Security rules.** `firestore.rules` and `storage.rules` both allow read/write to **any authenticated user** — there is no per-document ownership check. The agent API enforces its own check via `x-agent-token` because it runs as the Functions service account, which bypasses these rules. Don't loosen the rules further, and don't assume they isolate users.

## Environment variables

The Vite config in `vite.config.ts` accepts either `VITE_OPENROUTER_API_KEY` or plain `OPENROUTER_API_KEY` in the root `.env` and rewrites `import.meta.env.VITE_OPENROUTER_API_KEY` at build time. Putting the key on the client (`.env`) makes the browser call OpenRouter directly; putting it in `functions/.env` instead routes title suggestions through the Function and keeps the key off the client. Pick one — if both are set, the client path wins. Other overrides: `VITE_AGENT_API_URL`, `VITE_SUGGEST_TITLE_API_URL`.

## Conventions worth knowing

- UI strings are Portuguese (pt-PT). Dates use `Intl.DateTimeFormat("pt-PT", …)`. Keep new copy in pt-PT to match.
- When adding a field to an idea, update **three** places: `Idea` / `IdeaDraft` in `src/lib/types.ts`, the form/render code in `src/App.tsx`, and `allowedIdeaFields` in `functions/index.js` (otherwise the agent API will silently drop it).
- Firebase Hosting is configured as a SPA rewrite (`**` → `/index.html`), so any client-side routing you add doesn't need extra Hosting config.
