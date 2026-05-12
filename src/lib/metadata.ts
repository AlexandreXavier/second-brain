import type { IdeaDraft, IdeaType } from "./types";

type OEmbedResponse = {
  title?: string;
  author_name?: string;
  provider_name?: string;
  thumbnail_url?: string;
  html?: string;
};

type MicrolinkResponse = {
  status?: string;
  data?: {
    title?: string;
    description?: string;
    publisher?: string;
    author?: string;
    image?: {
      url?: string;
    };
    logo?: {
      url?: string;
    };
  };
};

function getUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hostLabel(url: URL) {
  return url.hostname.replace(/^www\./, "");
}

function htmlToText(html?: string) {
  if (!html) return "";
  const document = new DOMParser().parseFromString(html, "text/html");
  return document.body.textContent?.replace(/\s+/g, " ").trim() || "";
}

function classifyUrl(url: URL): IdeaType {
  const host = hostLabel(url);
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("twitter.com") || host.includes("x.com")) return "tweet";
  if (host.includes("instagram.com")) return "instagram";
  return "article";
}

function parseYouTubeId(url: URL) {
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.split("/").filter(Boolean)[0];
  }
  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/").filter(Boolean)[1];
  }
  return url.searchParams.get("v");
}

function parseSocialHandle(url: URL) {
  const [handle] = url.pathname.split("/").filter(Boolean);
  if (!handle || ["p", "reel", "tv", "status"].includes(handle)) return undefined;
  return handle.startsWith("@") ? handle : `@${handle}`;
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pedido de metadata falhou: ${response.status}`);
  return (await response.json()) as T;
}

async function getYouTubePreview(url: URL, originalUrl: string): Promise<IdeaDraft> {
  const id = parseYouTubeId(url);
  const directThumbnail = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
  try {
    const data = await fetchJson<OEmbedResponse>(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(originalUrl)}`,
    );
    return {
      type: "youtube",
      url: originalUrl,
      title: data.title || "Video do YouTube",
      source: "YouTube",
      sourceName: data.provider_name || "YouTube",
      author: data.author_name,
      thumbnailUrl: data.thumbnail_url || directThumbnail,
      imageUrl: data.thumbnail_url || directThumbnail,
      categories: [],
    };
  } catch {
    return {
      type: "youtube",
      url: originalUrl,
      title: "Video do YouTube",
      source: "YouTube",
      sourceName: "YouTube",
      thumbnailUrl: directThumbnail,
      imageUrl: directThumbnail,
      categories: [],
    };
  }
}

async function getTweetPreview(url: URL, originalUrl: string): Promise<IdeaDraft> {
  const handle = parseSocialHandle(url);
  try {
    const data = await fetchJson<OEmbedResponse>(
      `https://publish.twitter.com/oembed?omit_script=true&dnt=true&url=${encodeURIComponent(originalUrl)}`,
    );
    const text = htmlToText(data.html);
    return {
      type: "tweet",
      url: originalUrl,
      title: data.author_name ? `${data.author_name} no X` : "Publicacao do X",
      source: "X",
      sourceName: data.provider_name || "X",
      author: handle || data.author_name,
      previewText: text || originalUrl,
      categories: [],
    };
  } catch {
    return {
      type: "tweet",
      url: originalUrl,
      title: handle ? `${handle} no X` : "Publicacao do X",
      source: "X",
      sourceName: "X",
      author: handle,
      previewText: "Publicacao guardada do X. Abre a origem para ver o conteudo completo.",
      categories: [],
    };
  }
}

function getInstagramPreview(url: URL, originalUrl: string): IdeaDraft {
  const handle = parseSocialHandle(url);
  return {
    type: "instagram",
    url: originalUrl,
    title: handle ? `Publicacao de Instagram de ${handle}` : "Publicacao de Instagram",
    source: "Instagram",
    sourceName: "Instagram",
    author: handle,
    previewText: "O Instagram limita metadata publica, por isso este cartao guarda a origem e a atribuicao para consulta.",
    categories: [],
  };
}

async function getArticlePreview(url: URL, originalUrl: string): Promise<IdeaDraft> {
  const source = hostLabel(url);
  try {
    const data = await fetchJson<MicrolinkResponse>(
      `https://api.microlink.io/?screenshot=false&url=${encodeURIComponent(originalUrl)}`,
    );
    const meta = data.data;
    return {
      type: "article",
      url: originalUrl,
      title: meta?.title || source,
      source,
      sourceName: meta?.publisher || source,
      author: meta?.author,
      description: meta?.description,
      thumbnailUrl: meta?.image?.url || meta?.logo?.url,
      imageUrl: meta?.image?.url || meta?.logo?.url,
      categories: [],
    };
  } catch {
    return {
      type: "article",
      url: originalUrl,
      title: source,
      source,
      sourceName: source,
      description: originalUrl,
      categories: [],
    };
  }
}

export async function createPreviewFromUrl(value: string): Promise<IdeaDraft> {
  const url = getUrl(value.trim());
  if (!url) {
    return {
      type: "idea",
      title: value.trim() || "Ideia solta",
      previewText: value.trim(),
      categories: [],
    };
  }

  const originalUrl = url.toString();
  const type = classifyUrl(url);

  if (type === "youtube") return getYouTubePreview(url, originalUrl);
  if (type === "tweet") return getTweetPreview(url, originalUrl);
  if (type === "instagram") return getInstagramPreview(url, originalUrl);
  return getArticlePreview(url, originalUrl);
}

export function parseCategories(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean),
    ),
  );
}

export function formatCategories(categories: string[]) {
  return categories.join(", ");
}
