import { GiphyFetch } from "@giphy/js-fetch-api";

export const runtime = "nodejs";

type GifResult = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
};

type TenorResponse = {
  results?: Array<{
    id: string | number;
    title?: string;
    content_description?: string;
    media?: Array<{
      gif?: { url?: string; preview?: string };
      tinygif?: { url?: string; preview?: string };
      mediumgif?: { url?: string; preview?: string };
    }>;
  }>;
};

const giphy = process.env.GIPHY_API_KEY ? new GiphyFetch(process.env.GIPHY_API_KEY) : null;
const tenorApiKey = process.env.TENOR_API_KEY;

function isGifResult(result: GifResult | null): result is GifResult {
  return result !== null;
}

async function fetchGiphyGifs(query: string | undefined, limit: number) {
  if (!giphy) {
    return [];
  }

  const response = query
    ? await giphy.search(query, { limit, type: "gifs", rating: "pg-13" })
    : await giphy.trending({ limit, type: "gifs", rating: "pg-13" });

  return response.data
    .map((gif) => {
      const originalUrl = gif.images.original.url;
      const previewUrl =
        gif.images.fixed_width.webp ||
        gif.images.fixed_width.url ||
        gif.images.preview_gif.url ||
        originalUrl;

      if (!originalUrl || !previewUrl) {
        return null;
      }

      return {
        id: String(gif.id),
        title: gif.title || "GIF",
        url: originalUrl,
        previewUrl,
      };
    })
    .filter(isGifResult);
}

async function fetchTenorGifs(query: string | undefined, limit: number) {
  if (!tenorApiKey) {
    throw new Error("TENOR_API_KEY is missing.");
  }

  const url = new URL(query ? "https://api.tenor.com/v1/search" : "https://api.tenor.com/v1/trending");
  url.searchParams.set("key", tenorApiKey);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("contentfilter", "medium");

  if (query) {
    url.searchParams.set("q", query);
  }

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Tenor request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as TenorResponse;

  return (payload.results ?? [])
    .map((gif) => {
      const media = gif.media?.[0];
      const originalUrl = media?.gif?.url;
      const previewUrl = media?.tinygif?.url || media?.gif?.preview || media?.mediumgif?.url || originalUrl;

      if (!originalUrl || !previewUrl) {
        return null;
      }

      return {
        id: String(gif.id),
        title: gif.title || gif.content_description || "GIF",
        url: originalUrl,
        previewUrl,
      };
    })
    .filter(isGifResult);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 12), 1), 24);

  if (!giphy && !tenorApiKey) {
    return Response.json(
      { error: "GIF search is not configured. Add GIPHY_API_KEY or TENOR_API_KEY to your env." },
      { status: 503 },
    );
  }

  try {
    let results: GifResult[];

    if (giphy) {
      try {
        results = await fetchGiphyGifs(query, limit);
      } catch (error) {
        if (!tenorApiKey) {
          throw error;
        }

        console.error("[api/gifs] Giphy request failed, falling back to Tenor.", error);
        results = await fetchTenorGifs(query, limit);
      }
    } else {
      results = await fetchTenorGifs(query, limit);
    }

    return Response.json({ results });
  } catch (error) {
    console.error("[api/gifs] Could not load GIFs.", error);
    return Response.json({ error: "Could not load GIFs." }, { status: 500 });
  }
}