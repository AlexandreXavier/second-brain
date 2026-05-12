# Video Second Brain

A Firebase-backed internal app for saving video ideas, links, references, screenshots, categories, film dates, and agent-readable memory.

## What It Includes

- Google sign-in with Firebase Authentication.
- Firestore collection for shared `ideas`.
- Firebase Storage uploads for screenshots and reference images.
- Automatic best-effort metadata previews for YouTube, X/Twitter, Instagram, and articles.
- A responsive masonry visual library with search, category filters, inline editing, delete, film dates, and source links.
- A profile panel that generates a copyable agent token and an instruction block for Codex, Claude Code, or another agent.
- A Firebase Function API at `/ideas` that validates `x-agent-token` before reading or writing the database.

## Local Setup

```bash
npm install
npm run dev
```

For Google sign-in locally, open the app with `localhost`, for example `http://localhost:5173/`.
Firebase Auth blocks `127.0.0.1` unless you manually add it under Authentication, Settings, Authorized domains.

To enable AI title suggestions in local development, add this to the root `.env`:

```text
OPENROUTER_API_KEY=your_openrouter_key
```

`VITE_OPENROUTER_API_KEY` also works, but the app now accepts the plain `OPENROUTER_API_KEY` name too.

## Firebase Deploy

```bash
npm run build
firebase deploy --only hosting,firestore:rules,storage,functions
```

The app is already wired to project `my-brain-9d788` using the config from `firebase.md`.

For deployed title suggestions without exposing the API key in the browser, add this to `functions/.env` before deploying:

```text
OPENROUTER_API_KEY=your_openrouter_key
```

## Agent API

After deploying Functions, the default API URL is:

```text
https://us-central1-my-brain-9d788.cloudfunctions.net/agentApi
```

Agents must send:

```text
x-agent-token: YOUR_GENERATED_TOKEN
```

Supported routes:

- `GET /ideas`
- `GET /ideas?search=hook`
- `POST /ideas`
- `PATCH /ideas/:id`
- `DELETE /ideas/:id`

For local or custom Function URLs, add this to `.env.local`:

```text
VITE_AGENT_API_URL=https://your-function-url
```
