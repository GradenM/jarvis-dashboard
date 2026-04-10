import { NextRequest } from "next/server";
import { getCached, setCached, bustCache, TTL } from "@/lib/cache";
import { summarizeNewsItems } from "@/lib/claude";

const CACHE_KEY = "news";

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  category: string;
  priority: "breaking" | "high" | "normal";
};

export type NewsData = {
  items: NewsItem[];
  updatedAt: number;
};

export async function GET(request: NextRequest) {
  const bust = request.nextUrl.searchParams.get("bust") === "1";
  if (bust) bustCache(CACHE_KEY);

  const cached = getCached<NewsData>(CACHE_KEY);
  if (cached) return Response.json(cached);

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "NewsAPI key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey=${apiKey}`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`NewsAPI error ${res.status}: ${err.message ?? ""}`);
    }

    const json = await res.json();
    const articles: {
      title: string;
      url: string;
      source: { name: string };
      publishedAt: string;
      description: string;
    }[] = (json.articles ?? []).filter(
      (a: { title: string; url: string }) =>
        a.title && a.title !== "[Removed]" && a.url
    );

    // Summarize with Claude if key available
    let summaries: { index: number; summary: string; category: string; priority: string }[] = [];
    if (process.env.ANTHROPIC_API_KEY && articles.length > 0) {
      try {
        summaries = await summarizeNewsItems(
          articles.map((a) => ({
            title: a.title,
            description: a.description ?? "",
          }))
        );
      } catch (e) {
        console.error("[news/claude]", e);
      }
    }

    const summaryMap = new Map(summaries.map((s) => [s.index, s]));

    const items: NewsItem[] = articles.map((a, i) => {
      const s = summaryMap.get(i + 1);
      return {
        title: a.title,
        url: a.url,
        source: a.source?.name ?? "Unknown",
        publishedAt: a.publishedAt,
        summary: s?.summary ?? "",
        category: s?.category ?? "other",
        priority: (s?.priority ?? "normal") as NewsItem["priority"],
      };
    });

    // Sort: breaking → high → normal
    const priorityOrder = { breaking: 0, high: 1, normal: 2 };
    items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const data: NewsData = { items: items.slice(0, 8), updatedAt: Date.now() };
    setCached(CACHE_KEY, data, TTL.NEWS);
    return Response.json(data);
  } catch (err) {
    console.error("[news]", err);
    return Response.json({ error: "Failed to fetch news" }, { status: 502 });
  }
}
