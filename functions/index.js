const crypto = require("node:crypto");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const allowedIdeaFields = new Set([
  "type",
  "url",
  "title",
  "source",
  "sourceName",
  "author",
  "description",
  "previewText",
  "thumbnailUrl",
  "imageUrl",
  "categories",
  "filmDate",
  "notes",
]);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function send(res, status, payload) {
  res.status(status).json(payload);
}

function extractBearerToken(req) {
  const header = req.get("authorization") || req.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

async function authenticateSignedInUser(req, res) {
  const idToken = extractBearerToken(req);
  if (!idToken) {
    send(res, 401, { error: "Missing Authorization bearer token." });
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    send(res, 403, { error: "Invalid Firebase auth token." });
    return null;
  }
}

function serializeDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.().toISOString?.() ?? null,
  };
}

function cleanIdeaPayload(body, options = {}) {
  const payload = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (allowedIdeaFields.has(key)) {
      payload[key] = value;
    }
  }
  if (Array.isArray(payload.categories)) {
    payload.categories = payload.categories.map(String).filter(Boolean);
  }
  if (options.requireTitle && (typeof payload.title !== "string" || payload.title.trim().length === 0)) {
    payload.title = payload.url || "Untitled idea";
  }
  return payload;
}

async function authenticate(req, res) {
  const token = req.get("x-agent-token") || req.query.token;
  if (!token || typeof token !== "string") {
    send(res, 401, { error: "Missing x-agent-token." });
    return null;
  }

  const hash = hashToken(token);
  const tokenRef = db.collection("agentTokens").doc(hash);
  const snapshot = await tokenRef.get();
  if (!snapshot.exists || snapshot.data().active === false) {
    send(res, 403, { error: "Agent token is invalid or disabled." });
    return null;
  }

  await tokenRef.set(
    {
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { hash, ...snapshot.data() };
}

function sanitizeSuggestedTitle(value) {
  return String(value || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+[|:-]\s+.*/g, "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
}

function extractOpenRouterContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find((part) => part?.type === "text" && typeof part?.text === "string");
    return textPart?.text || "";
  }
  return "";
}

async function requestTitleSuggestion(body) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }

  const prompt = [
    "Suggest a short literal title for a saved content item.",
    "Be conservative, plain, and exact.",
    "If an image is attached, inspect the screenshot carefully and use visible text or the main visible subject.",
    "Prefer a clean existing title from the description or screenshot if one is clearly visible.",
    "Do not make the title catchy or editorial.",
    "Use fewer than 6 words.",
    "Return only the title text, nothing else.",
    "",
    `Current title: ${body.currentTitle || ""}`,
    `Description: ${body.description || ""}`,
    `Preview text: ${body.previewText || ""}`,
    `Source name: ${body.sourceName || ""}`,
    `Source: ${body.source || ""}`,
    `Author: ${body.author || ""}`,
    `URL: ${body.url || ""}`,
  ].join("\n");

  const messages = [
    {
      role: "system",
      content:
        "You rename saved creative references. You are literal, conservative, and concise. Return only the final title.",
    },
    body.imageDataUrl
      ? {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: body.imageDataUrl } },
          ],
        }
      : {
          role: "user",
          content: prompt,
        },
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemma-4-31b-it:free",
      temperature: 0,
      max_tokens: 24,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }

  const payload = await response.json();
  return sanitizeSuggestedTitle(extractOpenRouterContent(payload));
}

exports.agentApi = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, x-agent-token");
  res.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.path === "/health") {
    send(res, 200, { ok: true, service: "video-second-brain-agent-api" });
    return;
  }

  const tokenContext = await authenticate(req, res);
  if (!tokenContext) return;

  const [, resource, id] = req.path.split("/");
  if (resource !== "ideas") {
    send(res, 404, { error: "Unknown route. Use /ideas or /ideas/:id." });
    return;
  }

  try {
    if (req.method === "GET" && !id) {
      const limit = Math.min(Number(req.query.limit || 100), 250);
      const search = String(req.query.search || "").trim().toLowerCase();
      const snapshot = await db.collection("ideas").orderBy("createdAt", "desc").limit(limit).get();
      let ideas = snapshot.docs.map(serializeDoc);

      if (search) {
        ideas = ideas.filter((idea) => {
          const haystack = [
            idea.title,
            idea.source,
            idea.sourceName,
            idea.author,
            idea.description,
            idea.notes,
            ...(idea.categories || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(search);
        });
      }

      send(res, 200, { ideas });
      return;
    }

    if (req.method === "POST" && !id) {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const payload = cleanIdeaPayload(req.body, { requireTitle: true });
      const ref = await db.collection("ideas").add({
        ...payload,
        createdAt: now,
        updatedAt: now,
        createdBy: {
          type: "agent",
          tokenPreview: tokenContext.tokenPreview || "agent",
        },
      });
      const created = await ref.get();
      send(res, 201, { idea: serializeDoc(created) });
      return;
    }

    if (req.method === "PATCH" && id) {
      const ref = db.collection("ideas").doc(id);
      const payload = cleanIdeaPayload(req.body);
      await ref.set(
        {
          ...payload,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      const updated = await ref.get();
      send(res, 200, { idea: serializeDoc(updated) });
      return;
    }

    if (req.method === "DELETE" && id) {
      await db.collection("ideas").doc(id).delete();
      send(res, 200, { ok: true, id });
      return;
    }

    send(res, 405, { error: "Unsupported method for this route." });
  } catch (error) {
    console.error(error);
    send(res, 500, { error: "Agent API failed.", detail: error.message });
  }
});

exports.suggestTitle = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, { error: "Use POST." });
    return;
  }

  const decodedToken = await authenticateSignedInUser(req, res);
  if (!decodedToken) return;

  try {
    const title = await requestTitleSuggestion(req.body || {});
    send(res, 200, {
      ok: true,
      title,
      uid: decodedToken.uid,
    });
  } catch (error) {
    console.error(error);
    send(res, 500, { error: "Title suggestion failed.", detail: error.message });
  }
});
