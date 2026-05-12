import { auth, suggestTitleApiUrl } from "./firebase";

type TitleInput = {
  currentTitle?: string;
  description?: string;
  previewText?: string;
  sourceName?: string;
  source?: string;
  author?: string;
  url?: string;
  imageDataUrl?: string;
};

type OpenRouterMessage =
  | {
      role: "system" | "user";
      content: string;
    }
  | {
      role: "system" | "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

function sanitizeSuggestedTitle(value: string) {
  const cleaned = value
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+[|:-]\s+.*/g, "")
    .trim();

  return cleaned
    .split(" ")
    .filter(Boolean)
    .slice(0, 5)
    .join(" ")
    .trim();
}

function buildTitlePrompt(input: TitleInput) {
  return [
    "Suggest a short literal title for a saved content item.",
    "Be conservative, plain, and exact.",
    "If an image is attached, inspect the screenshot carefully and use visible text or the main visible subject.",
    "Prefer a clean existing title from the description or screenshot if one is clearly visible.",
    "Do not make the title catchy or editorial.",
    "Use fewer than 6 words.",
    "Return only the title text, nothing else.",
    "",
    `Current title: ${input.currentTitle || ""}`,
    `Description: ${input.description || ""}`,
    `Preview text: ${input.previewText || ""}`,
    `Source name: ${input.sourceName || ""}`,
    `Source: ${input.source || ""}`,
    `Author: ${input.author || ""}`,
    `URL: ${input.url || ""}`,
  ].join("\n");
}

function extractContent(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload &&
    "choices" in payload &&
    Array.isArray(payload.choices) &&
    payload.choices[0] &&
    typeof payload.choices[0] === "object"
  ) {
    const message = (payload.choices[0] as { message?: { content?: unknown } }).message;
    if (typeof message?.content === "string") return message.content;
    if (Array.isArray(message?.content)) {
      const textPart = message.content.find(
        (part) =>
          typeof part === "object" &&
          part &&
          "type" in part &&
          part.type === "text" &&
          "text" in part &&
          typeof part.text === "string",
      ) as { text: string } | undefined;
      return textPart?.text || "";
    }
  }

  return "";
}

async function callOpenRouterDirectly(input: TitleInput) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Falta a VITE_OPENROUTER_API_KEY.");
  }

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "You rename saved creative references. You are literal, conservative, and concise. Return only the final title.",
    },
    input.imageDataUrl
      ? {
          role: "user",
          content: [
            { type: "text", text: buildTitlePrompt(input) },
            { type: "image_url", image_url: { url: input.imageDataUrl } },
          ],
        }
      : {
          role: "user",
          content: buildTitlePrompt(input),
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
    throw new Error(`O pedido ao OpenRouter falhou: ${response.status}`);
  }

  const payload = await response.json();
  return sanitizeSuggestedTitle(extractContent(payload));
}

async function callSuggestTitleFunction(input: TitleInput) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Tens de iniciar sessao para sugerir um titulo.");
  }

  const token = await user.getIdToken();
  const response = await fetch(suggestTitleApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`A sugestao de titulo falhou: ${response.status}`);
  }

  const payload = (await response.json()) as { title?: string };
  return sanitizeSuggestedTitle(payload.title || "");
}

export async function suggestLiteralTitle(input: TitleInput) {
  if (import.meta.env.VITE_OPENROUTER_API_KEY) {
    return callOpenRouterDirectly(input);
  }

  return callSuggestTitleFunction(input);
}

export async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Nao foi possivel ler o ficheiro de imagem."));
    reader.readAsDataURL(file);
  });
}
